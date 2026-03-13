// storage.js
// Handles localStorage operations

const STORAGE_KEY = 'leetcode_mistake_tracker_data';

class StorageManager {
    static getData() {
        const data = localStorage.getItem(STORAGE_KEY);
        if (!data) {
            return {
                problems: [],
                streakInfo: { lastDate: null, count: 0 }
            };
        }
        return JSON.parse(data);
    }

    static saveData(data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }

    static getProblems() {
        return this.getData().problems;
    }

    static addProblem(problem) {
        const data = this.getData();
        problem.id = Date.now().toString(36) + Math.random().toString(36).substr(2);
        problem.createdAt = new Date().toISOString();
        data.problems.push(problem);
        
        // Update Streak
        this.updateStreak(data);
        
        this.saveData(data);
        return problem;
    }

    static updateProblem(id, updates) {
        const data = this.getData();
        const index = data.problems.findIndex(p => p.id === id);
        if (index !== -1) {
            data.problems[index] = { ...data.problems[index], ...updates };
            this.saveData(data);
            return data.problems[index];
        }
        return null;
    }

    static deleteProblem(id) {
        const data = this.getData();
        data.problems = data.problems.filter(p => p.id !== id);
        this.saveData(data);
    }

    static getStats() {
        const problems = this.getProblems();
        const total = problems.length;
        const mastered = problems.filter(p => !p.needsRevision).length;
        const revise = problems.filter(p => p.needsRevision).length;
        
        return { total, mastered, revise };
    }

    static updateStreak(data) {
        const today = new Date().toDateString();
        if (data.streakInfo.lastDate !== today) {
            // Check if it was yesterday
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            
            if (data.streakInfo.lastDate === yesterday.toDateString()) {
                data.streakInfo.count += 1;
            } else {
                data.streakInfo.count = 1;
            }
            data.streakInfo.lastDate = today;
        }
    }

    static getStreak() {
        return this.getData().streakInfo.count;
    }
}
