const fs = require('fs');

function checkBalance(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    let braces = 0;
    let parens = 0;
    let brackets = 0;
    let inString = false;
    let stringChar = '';
    let inComment = false;
    let commentType = ''; // 'single' or 'multi'
    let escaped = false;

    for (let i = 0; i < content.length; i++) {
        const char = content[i];
        const next = content[i+1];

        if (escaped) {
            escaped = false;
            continue;
        }

        if (inComment) {
            if (commentType === 'single' && char === '\n') {
                inComment = false;
            } else if (commentType === 'multi' && char === '*' && next === '/') {
                inComment = false;
                i++;
            }
            continue;
        }

        if (inString) {
            if (char === '\\') {
                escaped = true;
            } else if (char === stringChar) {
                inString = false;
            }
            continue;
        }

        if (char === '/' && next === '/') {
            inComment = true;
            commentType = 'single';
            i++;
            continue;
        }
        if (char === '/' && next === '*') {
            inComment = true;
            commentType = 'multi';
            i++;
            continue;
        }

        if (char === '"' || char === "'" || char === '`') {
            inString = true;
            stringChar = char;
            continue;
        }

        if (char === '{') braces++;
        if (char === '}') braces--;
        if (char === '(') parens++;
        if (char === ')') parens--;
        if (char === '[') brackets++;
        if (char === ']') brackets--;
    }

    console.log(`--- Result for ${filePath} ---`);
    console.log(`Braces balance: ${braces}`);
    console.log(`Parens balance: ${parens}`);
    console.log(`Brackets balance: ${brackets}`);
    if (inString) console.log('ERROR: still in a string!');
    if (inComment) console.log('ERROR: still in a comment!');
    console.log('----------------------------');
}

checkBalance('c:\\Users\\John Carlo\\OneDrive\\Desktop\\bbek-app\\be\\dbHelpers\\services\\waterBaptismRecords.js');
checkBalance('c:\\Users\\John Carlo\\OneDrive\\Desktop\\bbek-app\\be\\routes\\services\\waterBaptismRoutes.js');
