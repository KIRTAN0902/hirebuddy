// function predictJobRoleFromText(text) {
//   const lowerText = text.toLowerCase();
//   const roles = {
//     "frontend developer": [
//       "html", "css", "javascript", "react", "next.js", "tailwind", "frontend", "ui", "frontend development"
//     ],
//     "backend developer": [
//       "python", "django", "flask", "node", "express", "rest api", "sql", "postgres", "mongodb", "backend", "server-side", "web development"
//     ],
//     "data scientist": [
//       "machine learning", "deep learning", "data analysis", "data science", "pandas", "numpy", "sklearn", "tensorflow", "ai", "artificial intelligence", "neural networks"
//     ],
//     "ui/ux designer": [
//       "figma", "adobe xd", "wireframes", "prototypes", "user experience", "interface", "visual design", "ui/ux"
//     ]
//   };

//   const roleScores = {};

//   for (const role in roles) {
//     const keywords = roles[role];
//     let score = 0;
//     for (const keyword of keywords) {
//       if (lowerText.includes(keyword)) {
//         console.log(`[MATCH] ${role} matched keyword: "${keyword}"`);
//         score++;
//       }
//     }
//     roleScores[role] = score;
//   }

//   console.log("[DEBUG] Role Scores:", roleScores);

//   const sorted = Object.entries(roleScores).sort((a, b) => b[1] - a[1]);
//   const [topRole, score] = sorted[0];
//   return score > 0 ? topRole : null;
// }
