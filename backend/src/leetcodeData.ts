const LEETCODE_GRAPHQL_ENDPOINT = 'https://leetcode.com/graphql';

const userProfileQuery = `
query userProfile($username: String!) {
  matchedUser(username: $username) {
    username
    profile {
      ranking
      reputation
      userAvatar
      realName
    }
    submitStats: submitStatsGlobal {
      acSubmissionNum {
        difficulty
        count
      }
      totalSubmissionNum {
        difficulty
        count
      }
    }
  }
}`;

const userContestRankingInfoQuery = `
query userContestRankingInfo($username: String!) {
  userContestRanking(username: $username) {
    attendedContestsCount
    rating
    globalRanking
    topPercentage
  }
}`;

const recentAcSubmissionsQuery = `
query recentAcSubmissions($username: String!) {
  recentAcSubmissionList(username: $username) {
    title
    lang
  }
}`;

export async function fetchLeetCodeData(username: string): Promise<any> {
  async function postQuery(query: string, variables: object) {
    const res = await fetch(LEETCODE_GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, variables }),
    });
    if (!res.ok) throw new Error('Failed to fetch from LeetCode');
    return res.json();
  }

  const [profileRes, contestRes, recentRes]: any[] = await Promise.all([
    postQuery(userProfileQuery, { username }),
    postQuery(userContestRankingInfoQuery, { username }),
    postQuery(recentAcSubmissionsQuery, { username }),
  ]);

  const profile = profileRes.data?.matchedUser;
  const contest = contestRes.data?.userContestRanking;
  const recent = recentRes.data?.recentAcSubmissionList;

  return {
    username: profile?.username,
    avatar: profile?.profile?.userAvatar,
    realName: profile?.profile?.realName,
    ranking: profile?.profile?.ranking,
    reputation: profile?.profile?.reputation,
    acSubmissionNum: profile?.submitStats?.acSubmissionNum,
    totalSubmissionNum: profile?.submitStats?.totalSubmissionNum,
    attendedContestsCount: contest?.attendedContestsCount,
    rating: contest?.rating,
    globalRanking: contest?.globalRanking,
    topPercentage: contest?.topPercentage,
    recentAcSubmissions: recent,
  };
} 