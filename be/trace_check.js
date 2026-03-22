const fs = require('fs');
const content = fs.readFileSync(process.argv[2], 'utf8');
let b=0, p=0, s=false, sc='', c=false, ct='', e=false;
let line=1;
for(let i=0;i<content.length;i++){
    const ch=content[i], nx=content[i+1];
    if(ch==='\n') line++;
    if(e){e=false;continue;}
    if(c){if(ct==='s'&&ch==='\n')c=false;else if(ct==='m'&&ch==='*'&&nx==='/'){c=false;i++;}continue;}
    if(s){if(ch==='\\')e=true;else if(ch===sc)s=false;continue;}
    if(ch==='/'&&nx==='/'){c=true;ct='s';i++;continue;}
    if(ch==='/'&&nx==='*'){c=true;ct='m';i++;continue;}
    if(ch==='"'||ch==="'"||ch==='`'){s=true;sc=ch;continue;}
    if(ch==='{')b++;if(ch==='}')b--;
    if(ch==='(')p++;if(ch===')')p--;
    if (b < 0 || p < 0) {
        console.log(`Line ${line}: Negative balance! B:${b} P:${p}`);
        // process.exit(1);
    }
}
console.log(`Final Balance B:${b} P:${p}`);
