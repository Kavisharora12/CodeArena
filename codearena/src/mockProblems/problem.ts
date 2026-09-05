export type Example = {
	id: number;
	inputText: string;
	outputText: string;
	explanation?: string;
	img?: string;
};

export type Problem = {
	id: string;
	title: string;
	difficulty: string;
	category: string;
	order: number;
	videoId?: string;
	problemStatement: string;
	examples: Example[];
	constraints: string;
};

export const problems: Problem[] = [
	{
		id: "two-sum",
		title: "Two Sum",
		difficulty: "Easy",
		category: "Array",
		order: 1,
		videoId: "",
		problemStatement: `
			Given an array of integers nums and an integer target, 
			return indices of the two numbers such that they add up to target.

			You may assume that each input would have exactly one solution, 
			and you may not use the same element twice.
		`,
		examples: [
			{
				id: 1,
				inputText: "nums = [2,7,11,15], target = 9",
				outputText: "[0,1]",
				explanation:
					"Because nums[0] + nums[1] == 9, we return [0, 1].",
			},
			{
				id: 2,
				inputText: "nums = [3,2,4], target = 6",
				outputText: "[1,2]",
			},
		],
		constraints: `
			<li>2 ≤ nums.length ≤ 10⁴</li>
			<li>-10⁹ ≤ nums[i] ≤ 10⁹</li>
			<li>-10⁹ ≤ target ≤ 10⁹</li>
			<li>Only one valid answer exists.</li>
		`,
	},

	{
		id: "reverse-linked-list",
		title: "Reverse Linked List",
		difficulty: "Hard",
		category: "Linked List",
		order: 2,
		videoId: "",
		problemStatement: `
			Given the head of a singly linked list, reverse the list,
			and return the reversed list.
		`,
		examples: [
			{
				id: 1,
				inputText: "head = [1,2,3,4,5]",
				outputText: "[5,4,3,2,1]",
			},
		],
		constraints: `
			<li>The number of nodes in the list is in the range [0, 5000].</li>
			<li>-5000 ≤ Node.val ≤ 5000</li>
		`,
	},

	{
		id: "jump-game",
		title: "Jump Game",
		difficulty: "Medium",
		category: "Dynamic Programming",
		order: 3,
		videoId: "",
		problemStatement: `
			You are given an integer array nums. You are initially positioned
			at the first index of the array.

			Determine if you can reach the last index.
		`,
		examples: [
			{
				id: 1,
				inputText: "nums = [2,3,1,1,4]",
				outputText: "true",
			},
			{
				id: 2,
				inputText: "nums = [3,2,1,0,4]",
				outputText: "false",
			},
		],
		constraints: `
			<li>1 ≤ nums.length ≤ 10⁴</li>
			<li>0 ≤ nums[i] ≤ 10⁵</li>
		`,
	},

	{
		id: "valid-parentheses",
		title: "Valid Parentheses",
		difficulty: "Easy",
		category: "Stack",
		order: 4,
		videoId: "",
		problemStatement: `
			Given a string s containing just the characters
			'(', ')', '{', '}', '[' and ']',
			determine if the input string is valid.
		`,
		examples: [
			{
				id: 1,
				inputText: 's = "()"',
				outputText: "true",
			},
			{
				id: 2,
				inputText: 's = "()[]{}"',
				outputText: "true",
			},
			{
				id: 3,
				inputText: 's = "(]"',
				outputText: "false",
			},
		],
		constraints: `
			<li>1 ≤ s.length ≤ 10⁴</li>
			<li>s consists of parentheses only: ()[]{}.</li>
		`,
	},

	{
		id: "search-a-2d-matrix",
		title: "Search a 2D Matrix",
		difficulty: "Medium",
		category: "Binary Search",
		order: 5,
		videoId: "",
		problemStatement: `
			Write an efficient algorithm that searches for a value target
			in an m x n integer matrix.
		`,
		examples: [
			{
				id: 1,
				inputText: "matrix = [[1,3,5,7],[10,11,16,20],[23,30,34,60]], target = 3",
				outputText: "true",
			},
		],
		constraints: `
			<li>m == matrix.length</li>
			<li>n == matrix[i].length</li>
			<li>1 ≤ m, n ≤ 100</li>
		`,
	},

	{
		id: "container-with-most-water",
		title: "Container With Most Water",
		difficulty: "Medium",
		category: "Two Pointers",
		order: 6,
		videoId: "",
		problemStatement: `
			You are given an integer array height.
			Find two lines that together with the x-axis form a container
			such that the container contains the most water.
		`,
		examples: [
			{
				id: 1,
				inputText: "height = [1,8,6,2,5,4,8,3,7]",
				outputText: "49",
			},
		],
		constraints: `
			<li>2 ≤ height.length ≤ 10⁵</li>
			<li>0 ≤ height[i] ≤ 10⁴</li>
		`,
	},

	{
		id: "merge-intervals",
		title: "Merge Intervals",
		difficulty: "Medium",
		category: "Intervals",
		order: 7,
		videoId: "",
		problemStatement: `
			Given an array of intervals where intervals[i] = [starti, endi],
			merge all overlapping intervals.
		`,
		examples: [
			{
				id: 1,
				inputText: "intervals = [[1,3],[2,6],[8,10],[15,18]]",
				outputText: "[[1,6],[8,10],[15,18]]",
			},
		],
		constraints: `
			<li>1 ≤ intervals.length ≤ 10⁴</li>
			<li>intervals[i].length == 2</li>
		`,
	},

	{
		id: "maximum-depth-of-binary-tree",
		title: "Maximum Depth of Binary Tree",
		difficulty: "Easy",
		category: "Tree",
		order: 8,
		videoId: "",
		problemStatement: `
			Given the root of a binary tree, return its maximum depth.
		`,
		examples: [
			{
				id: 1,
				inputText: "root = [3,9,20,null,null,15,7]",
				outputText: "3",
			},
		],
		constraints: `
			<li>The number of nodes is in the range [0, 10⁴].</li>
			<li>-100 ≤ Node.val ≤ 100</li>
		`,
	},

	{
		id: "best-time-to-buy-and-sell-stock",
		title: "Best Time to Buy and Sell Stock",
		difficulty: "Easy",
		category: "Array",
		order: 9,
		videoId: "",
		problemStatement: `
			You are given an array prices where prices[i] is the price
			of a given stock on the ith day.

			Find the maximum profit you can achieve.
		`,
		examples: [
  {
    id: 1,
    inputText: "nums = [2,7,11,15], target = 9",
    outputText: "[0,1]",
  },
  {
    id: 2,
    inputText: "nums = [3,2,4], target = 6",
    outputText: "[1,2]",
  },
  {
    id: 3,
    inputText: "nums = [3,3], target = 6",
    outputText: "[0,1]",
  },
],
		constraints: `
			<li>1 ≤ prices.length ≤ 10⁵</li>
			<li>0 ≤ prices[i] ≤ 10⁴</li>
		`,
	},

	{
		id: "subsets",
		title: "Subsets",
		difficulty: "Medium",
		category: "Backtracking",
		order: 10,
		videoId: "",
		problemStatement: `
			Given an integer array nums of unique elements,
			return all possible subsets.
		`,
		examples: [
			{
				id: 1,
				inputText: "nums = [1,2,3]",
				outputText: "[[],[1],[2],[1,2],[3],[1,3],[2,3],[1,2,3]]",
			},
		],
		constraints: `
			<li>1 ≤ nums.length ≤ 10</li>
			<li>-10 ≤ nums[i] ≤ 10</li>
			<li>All the numbers of nums are unique.</li>
		`,
	},
];