import React from 'react'

export const HomePage = () => {
  return (
        <div className="max-w-4xl mx-auto py-12">
          <div className="text-center mb-16">
            <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
              CP-mate
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Your competitive programming profile aggregator
            </p>
            <div className="flex justify-center gap-4">
              <button className="glass px-6 py-3 rounded-lg font-medium hover:bg-white/20 dark:hover:bg-white/10 transition-all">
                Get Started
              </button>
              <button className="px-6 py-3 rounded-lg border border-border/50 font-medium hover:bg-accent transition-all">
                Learn More
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass p-6 rounded-xl">
              <h3 className="text-lg font-semibold mb-2">LeetCode</h3>
              <p className="text-muted-foreground">Track your LeetCode progress and submissions</p>
            </div>
            <div className="glass p-6 rounded-xl">
              <h3 className="text-lg font-semibold mb-2">Codeforces</h3>
              <p className="text-muted-foreground">Monitor your Codeforces rating and contests</p>
            </div>
            <div className="glass p-6 rounded-xl">
              <h3 className="text-lg font-semibold mb-2">Dashboard</h3>
              <p className="text-muted-foreground">View your Dashboard and get to know how you perform.</p>
            </div>
          </div>
        </div>
  )
}
