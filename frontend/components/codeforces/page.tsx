"use client";

import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

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

export default function CodeforcesPage() {
  const [username, setUsername] = useState("");
  const [problems, setProblems] = useState<Problem[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [page, setPage] = useState(1);
  const [sortOrder, setSortOrder] = useState("asc");
  const [filterRating, setFilterRating] = useState<string | null>(null);
  const [filterTags, setFilterTags] = useState<string[]>([]);

  const problemsPerPage = 25;

  useEffect(() => {
    fetch("https://codeforces.com/api/problemset.problems")
      .then((res) => res.json())
      .then((data) => setProblems(data.result.problems));
  }, []);

  const fetchSubmissions = async () => {
    if (!username) return;
    const res = await fetch(
      `https://codeforces.com/api/user.status?handle=${username}`
    );
    const data = await res.json();
    setSubmissions(data.result);
  };

  const getStatus = (problem: Problem) => {
    const attempted = submissions.find(
      (s) =>
        s.problem.contestId === problem.contestId &&
        s.problem.index === problem.index
    );
    if (!attempted) return "Unattempted";
    return attempted.verdict === "OK" ? "Solved" : "Attempted";
  };

  const uniqueTags = Array.from(
    new Set(problems.flatMap((p) => p.tags))
  ).sort();

  const filteredProblems = problems
    .filter((p) => (filterRating ? p.rating === Number(filterRating) : true))
    .filter((p) =>
      filterTags.length > 0
        ? filterTags.every((tag) => p.tags.includes(tag))
        : true
    )
    .sort((a, b) => {
      if (!a.rating) return 1;
      if (!b.rating) return -1;
      return sortOrder === "asc" ? a.rating - b.rating : b.rating - a.rating;
    });

  const startIndex = (page - 1) * problemsPerPage;
  const paginatedProblems = filteredProblems.slice(
    startIndex,
    startIndex + problemsPerPage
  );

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <h1 className="text-3xl font-bold mb-6 text-center">CP-mate</h1>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-center mb-6">
        <Input
          placeholder="Enter Codeforces Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-64"
        />
        <Button onClick={fetchSubmissions}>Search</Button>

        <Select onValueChange={(val) => setSortOrder(val)} defaultValue="asc">
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Sort by Rating" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="asc">Rating Asc</SelectItem>
            <SelectItem value="desc">Rating Desc</SelectItem>
          </SelectContent>
        </Select>

        <Select onValueChange={(val) => setFilterRating(val)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by Rating" />
          </SelectTrigger>
          <SelectContent>
            {Array.from(new Set(problems.map((p) => p.rating).filter(Boolean))).map(
              (rating) => (
                <SelectItem key={rating} value={String(rating)}>
                  {rating}
                </SelectItem>
              )
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Multi-tag filter */}
      <div className="flex flex-wrap gap-2 justify-center mb-6 max-w-5xl mx-auto">
        {uniqueTags.map((tag) => (
          <Button
            key={tag}
            variant={filterTags.includes(tag) ? "default" : "secondary"}
            className="text-xs"
            onClick={() =>
              setFilterTags((prev) =>
                prev.includes(tag)
                  ? prev.filter((t) => t !== tag)
                  : [...prev, tag]
              )
            }
          >
            {tag}
          </Button>
        ))}
      </div>

      <Card>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-700 text-sm">
              <thead>
                <tr className="bg-gray-800">
                  <th className="border border-gray-700 p-2">S No</th>
                  <th className="border border-gray-700 p-2">Problem Name</th>
                  <th className="border border-gray-700 p-2">Rating</th>
                  <th className="border border-gray-700 p-2">Tags</th>
                  <th className="border border-gray-700 p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {paginatedProblems.map((p, i) => (
                  <tr key={`${p.contestId}${p.index}`} className="hover:bg-gray-900">
                    <td className="border border-gray-700 p-2">
                      {startIndex + i + 1}
                    </td>
                    <td className="border border-gray-700 p-2">
                      <a
                        href={`https://codeforces.com/problemset/problem/${p.contestId}/${p.index}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:underline"
                      >
                        {p.name}
                      </a>
                    </td>
                    <td className="border border-gray-700 p-2">
                      {p.rating || "-"}
                    </td>
                    <td className="border border-gray-700 p-2">
                      {p.tags.join(", ")}
                    </td>
                    <td className="border border-gray-700 p-2">
                      {getStatus(p)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center items-center gap-4 mt-6">
        <Button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
          Prev
        </Button>
        <span>
          Page {page} of {Math.ceil(filteredProblems.length / problemsPerPage)}
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
