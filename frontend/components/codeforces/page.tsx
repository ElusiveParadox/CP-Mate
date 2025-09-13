"use client";

import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { ChevronDown, CheckIcon } from "lucide-react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { cn } from "@/lib/utils";

interface Problem {
  contestId: number;
  index: string;
  name: string;
  rating?: number;
  tags: string[];
}

interface Submission {
  problem: Problem;
  verdict: string;
}

type StatusFilter = "Accepted" | "Attempted" | "Unattempted";

const Popover = PopoverPrimitive.Root;

const PopoverTrigger = PopoverPrimitive.Trigger;

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = "center", sideOffset = 4, ...props }, ref) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn(
        "z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 max-h-48 overflow-y-auto overscroll-contain",
        className
      )}
      onWheel={(e) => e.stopPropagation()}
      {...props}
    />
  </PopoverPrimitive.Portal>
));
PopoverContent.displayName = PopoverPrimitive.Content.displayName;

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "peer h-4 w-4 shrink-0 rounded-sm border border-primary shadow focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      className={cn("flex items-center justify-center text-current")}
    >
      <CheckIcon className="h-4 w-4" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export default function CodeforcesPage(): React.ReactElement {
  const [username, setUsername] = useState<string>('');
  const [problems, setProblems] = useState<Problem[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [page, setPage] = useState<number>(1);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [filterRatings, setFilterRatings] = useState<number[]>([]);
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [statusFilters, setStatusFilters] = useState<StatusFilter[]>([]);
  const [showTags, setShowTags] = useState<boolean>(true);
  const [isDropdownHovered, setIsDropdownHovered] = useState<boolean>(false);

  const problemsPerPage = 25;

  // Persist username in localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('codeforces-username', username);
    }
  }, [username]);

  // Prevent page scroll when dropdown is hovered
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (isDropdownHovered) {
        e.preventDefault();
      }
    };
    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [isDropdownHovered]);

  // Fetch all problems
  useEffect(() => {
    const fetchProblems = async (): Promise<void> => {
      try {
        const res = await fetch("https://codeforces.com/api/problemset.problems");
        const data = await res.json();
        if (data.status === "OK") {
          setProblems(data.result.problems);
        } else {
          toast.error("Failed to fetch problemset.");
        }
      } catch {
        toast.error("Network error while fetching problems.");

      }
    };
    fetchProblems();
  }, []);

  // Fetch user submissions
  const fetchSubmissions = React.useCallback(async (user: string): Promise<void> => {
    if (!user.trim()) {
      toast.error("Please enter a valid username.");
      return;
    }

    try {
      const res = await fetch(
        `https://codeforces.com/api/user.status?handle=${user}`
      );
      const data = await res.json();

      if (data.status !== "OK") {
        toast.error("Unable to fetch or ID does not exist.");
        return;
      }

      setSubmissions(data.result);
      toast.success("ID found and submissions fetched successfully!");
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  }, []);

  // Handle refresh behavior

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isReload = performance.navigation.type === 1; // 1 is reload
      if (isReload) {
        localStorage.removeItem('codeforces-username');
        setUsername('');
      } else {
        const stored = localStorage.getItem('codeforces-username');
        if (stored) {
          setUsername(stored);
          void fetchSubmissions(stored);
        }
      }
    }
  }, [fetchSubmissions]);

  // Determine status of a problem
  const getStatus = (problem: Problem): StatusFilter => {
    const attempted = submissions.filter(
      (s) =>
        s.problem.contestId === problem.contestId &&
        s.problem.index === problem.index
    );
    if (attempted.length === 0) return "Unattempted";
    if (attempted.some((s) => s.verdict === "OK")) return "Accepted";
    return "Attempted";
  };

  const uniqueTags: string[] = Array.from(
    new Set(problems.flatMap((p) => p.tags))
  ).sort();

  // --- Enhanced Filtering Logic ---
  const filteredProblems = problems
    .filter((p) => {
      if (filterRatings.length === 0) return true;
      if (!p.rating) return false;
      return filterRatings.includes(p.rating);
    })
    .filter((p) => {
      if (filterTags.length === 0) return true;
      return filterTags.every((tag) => p.tags.includes(tag));
    })
    .filter((p) => {
      if (statusFilters.length === 0) return true;
      return statusFilters.includes(getStatus(p));
    })
    .sort((a, b) => {
      const ratingA = a.rating ?? 0;
      const ratingB = b.rating ?? 0;
      return sortOrder === "asc" ? ratingA - ratingB : ratingB - ratingA;
    });

  // Show toast if no problems match
  useEffect(() => {
    if (filteredProblems.length === 0) {
      toast("No problems to fetch", {
        style: { color: "blue" },
        position: "top-right",
      });
    }
  }, [filteredProblems]);

  const startIndex = (page - 1) * problemsPerPage;
  const paginatedProblems = filteredProblems.slice(
    startIndex,
    startIndex + problemsPerPage
  );



  return (
    <div className="min-h-screen bg-black text-white p-6 font-lexend">
      <h1 className="text-4xl font-bold mb-6 text-center">CP-mate</h1>

      {/* Search */}
      <div className="flex justify-center mb-6">
        <Input
          placeholder="Enter Codeforces Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void fetchSubmissions(username);
          }}
          className="w-80 text-lg"
        />
        <Button
          onClick={() => void fetchSubmissions(username)}
          className="ml-2 text-lg"
        >
          Search
        </Button>
      </div>

      <Card className="bg-gray-900 border border-gray-700 rounded-lg shadow-lg">
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-base">
              <thead>
                <tr className="bg-gray-800 text-left font-lexend text-lg">
                  <th className="border border-gray-700 p-3">S No</th>
                  <th className="border border-gray-700 p-3">Problem Name</th>
                  <th className="border border-gray-700 p-3">
                    <div className="flex items-center justify-between">
                      Rating
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="ghost" size="sm" className="w-6 h-6 p-0">
                            <ChevronDown className="w-4 h-4 text-white" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-56 bg-black border-gray-700 text-white" onMouseEnter={() => setIsDropdownHovered(true)} onMouseLeave={() => setIsDropdownHovered(false)}>
                          <div className="space-y-2">
                            <Button variant="ghost" size="sm" onClick={() => setSortOrder("asc")} className="w-full justify-start">
                              Ascending
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => setSortOrder("desc")} className="w-full justify-start">
                              Descending
                            </Button>
                            <div className="border-t border-gray-600 my-2"></div>
                            {Array.from(
                              new Set(
                                problems
                                  .map((p) => p.rating)
                                  .filter((r): r is number => Boolean(r))
                              )
                            ).map((rating) => (
                              <div key={rating} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`rating-${rating}`}
                                  checked={filterRatings.includes(rating)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setFilterRatings((prev) => [...prev, rating]);
                                    } else {
                                      setFilterRatings((prev) => prev.filter((r) => r !== rating));
                                    }
                                  }}
                                />
                                <label htmlFor={`rating-${rating}`} className="text-sm">
                                  {rating}
                                </label>
                              </div>
                            ))}
                            <Button variant="ghost" size="sm" onClick={() => setFilterRatings([])} className="w-full justify-start">
                              Clear Filter
                            </Button>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </th>

                  <th className="border border-gray-700 p-3">
                    <div className="flex items-center justify-between">
                      Tags
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="ghost" size="sm" className="w-6 h-6 p-0">
                            <ChevronDown className="w-4 h-4 text-white" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-56 bg-black border-gray-700 text-white" onMouseEnter={() => setIsDropdownHovered(true)} onMouseLeave={() => setIsDropdownHovered(false)}>
                          <div className="space-y-2">
                            {uniqueTags.map((tag) => (
                              <div key={tag} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`tag-${tag}`}
                                  checked={filterTags.includes(tag)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setFilterTags((prev) => [...prev, tag]);
                                    } else {
                                      setFilterTags((prev) => prev.filter((t) => t !== tag));
                                    }
                                  }}
                                />
                                <label htmlFor={`tag-${tag}`} className="text-sm">
                                  {tag}
                                </label>
                              </div>
                            ))}
                            <div className="border-t border-gray-600 my-2"></div>
                            <Button variant="ghost" size="sm" onClick={() => setShowTags((p) => !p)} className="w-full justify-start">
                              {showTags ? "Hide Tags" : "Show Tags"}
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => setFilterTags([])} className="w-full justify-start">
                              Clear Filter
                            </Button>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </th>

                  <th className="border border-gray-700 p-3">
                    <div className="flex items-center justify-between">
                      Status
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="ghost" size="sm" className="w-6 h-6 p-0">
                            <ChevronDown className="w-4 h-4 text-white" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-56 bg-black border-gray-700 text-white" onMouseEnter={() => setIsDropdownHovered(true)} onMouseLeave={() => setIsDropdownHovered(false)}>
                          <div className="space-y-2">
                            {(["Accepted", "Attempted", "Unattempted"] as StatusFilter[]).map(
                              (status) => (
                                <div key={status} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`status-${status}`}
                                    checked={statusFilters.includes(status)}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        setStatusFilters((prev) => [...prev, status]);
                                      } else {
                                        setStatusFilters((prev) => prev.filter((s) => s !== status));
                                      }
                                    }}
                                  />
                                  <label htmlFor={`status-${status}`} className="text-sm">
                                    {status}
                                  </label>
                                </div>
                              )
                            )}
                            <div className="border-t border-gray-600 my-2"></div>
                            <Button variant="ghost" size="sm" onClick={() => setStatusFilters([])} className="w-full justify-start">
                              Clear Filter
                            </Button>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </th>
                </tr>
              </thead>

              <tbody className="font-poppins text-base">
                {paginatedProblems.map((p, i) => {
                  const status = getStatus(p);
                  const rowClass =
                    status === "Accepted"
                      ? "text-green-400"
                      : status === "Attempted"
                      ? "text-gray-400"
                      : "text-white";

                  return (
                    <tr
                      key={`${p.contestId}-${p.index}`}
                      className={`border-b border-gray-700 hover:bg-gray-800 transition ${rowClass}`}
                    >
                      <td className="p-3">{startIndex + i + 1}</td>
                      <td className="p-3">
                        <a
                          href={`https://codeforces.com/problemset/problem/${p.contestId}/${p.index}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:underline"
                        >
                          {p.name}
                        </a>
                      </td>
                      <td className="p-3">{p.rating ?? "-"}</td>
                      <td className="p-3">{showTags ? p.tags.join(", ") : "-"}</td>
                      <td className="p-3">{status}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center items-center gap-4 mt-6 font-lexend text-lg">
        <Button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          Prev
        </Button>
        <span>
          Page {page} of {Math.ceil(filteredProblems.length / problemsPerPage) || 1}
        </span>
        <Button
          onClick={() =>
            setPage((p) =>
              p < Math.ceil(filteredProblems.length / problemsPerPage) ? p + 1 : p
            )
          }
          disabled={page >= Math.ceil(filteredProblems.length / problemsPerPage)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
