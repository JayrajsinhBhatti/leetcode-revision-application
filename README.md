# LeetCode Revision Notebook

A personal mistake-tracking and revision web application for developers practicing problems on LeetCode.  
This tool helps you **track mistakes, understand incorrect approaches, and revise problems efficiently** so that the same mistakes are not repeated in the future.

Instead of just solving problems and moving on, this application helps you **build a structured learning system for DSA practice**.

---

## Features

### Dashboard
- Displays learning statistics
- Total problems saved
- Mastered problems
- Problems that need revision
- Daily learning streak
- Recently added problems

### Add Problem
Save detailed information about a problem you solved:

- LeetCode problem link
- Problem title (auto extracted)
- Difficulty level
- Topic / tag
- Mistake type
- What went wrong
- Correct approach / learning
- Time taken
- Confidence level

The app can automatically extract the **problem title and difficulty** from the LeetCode link.

---

### Mistake Tracker
View all saved problems in a structured table.

You can:
- Filter by difficulty
- Filter by revision status
- View full problem details
- Delete entries
- Mark problems as mastered

---

### Problem Detail Page
Each problem includes detailed notes such as:

- Mistake type
- Explanation of what went wrong
- Correct approach
- Time taken
- Confidence level
- Revision status

This helps you quickly revisit the thought process behind previous mistakes.

---

### Revision Mode (Flashcard Style)
A dedicated revision system that shows problems requiring revision.

Workflow:
1. View the problem
2. Try recalling the solution
3. Reveal your previous mistake and correct approach
4. Mark as **Mastered** if you remember it

This helps reinforce algorithm patterns and improve long-term memory.

---

## Tech Stack

- HTML5
- CSS3
- JavaScript (Vanilla JS)
- Browser Local Storage
- LeetCode GraphQL API for problem data extraction

No backend server is required.

---

## Project Structure
project
│
├── index.html # Main application UI
├── style.css # UI styling
├── app.js # Main application logic
├── storage.js # LocalStorage management
└── README.md


---

## How It Works

All problems and user data are stored in **browser localStorage**.

Stored data includes:

- problem information
- revision status
- learning streak
- notes about mistakes

This allows the application to run **fully in the browser without a database**.

---

## Running the Project

1. Clone the repository


git clone https://github.com/JayrajsinhBhatti/leetcode-revise-application.git


2. Open the project folder.

3. Run the project by opening `index.html` in your browser.

or use a local server:


Live Server (VS Code)


---

## Why This Project Exists

When practicing coding problems, many developers repeatedly make the same mistakes because they do not track them.

This tool helps you:

- Build a personal **DSA mistake journal**
- Learn from incorrect approaches
- Improve algorithm pattern recognition
- Track progress over time

---

## Future Improvements

Possible enhancements:

- spaced repetition algorithm for revision
- tagging system for algorithms
- code snippet storage
- statistics by topic
- cloud synchronization
- mobile friendly UI

---

## License

This project is open-source and available for personal use and learning.
