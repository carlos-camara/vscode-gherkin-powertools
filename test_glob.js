const globs = ["**/node_modules/**", "**/.venv/**", "**/venv/**", "**/env/**"];
const patterns = globs.map(g => g.replace(/\./g, '\\.').replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*').replace(/\?/g, '.'));
const regex = new RegExp(`^(${patterns.join('|')})$`);
console.log(regex);
console.log(regex.test("/Users/carlos/Desktop/github/vscode-gherkin-beautifier/node_modules/foo/bar.py"));
console.log(regex.test("/Users/carlos/Desktop/github/vscode-gherkin-beautifier/.venv/foo/bar.py"));
console.log(regex.test("/Users/carlos/Desktop/github/vscode-gherkin-beautifier/src/env/bar.py"));
console.log(regex.test("/Users/carlos/Desktop/github/vscode-gherkin-beautifier/src/steps/bar.py"));
