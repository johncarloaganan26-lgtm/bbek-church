const fs = require('fs');
const content = fs.readFileSync(process.argv[2], 'utf8');
let b=0, p=0, s=false, sc='', c=false, ct='', e=false;
for(let i=0;i<content.length;i++){
    const ch=content[i], nx=content[i+1];
    if(e){e=false;continue;}
    if(c){if(ct==='s'&&ch==='\n')c=false;else if(ct==='m'&&ch==='*'&&nx==='/'){c=false;i++;}continue;}
    if(s){if(ch==='\\')e=true;else if(ch===sc)s=false;continue;}
    if(ch==='/'&&nx==='/'){c=true;ct='s';i++;continue;}
    if(ch==='/'&&nx==='*'){c=true;ct='m';i++;continue;}
    if(ch==='"'||ch==="'"||ch==='`'){s=true;sc=ch;continue;}
    if(ch==='{')b++;if(ch==='}')b--;
    if(ch==='(')p++;if(ch===')')p--;
}
console.log(b,p);
