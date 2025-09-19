"use strict";(()=>{var e={};e.id=16,e.ids=[16],e.modules={399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},2081:e=>{e.exports=require("child_process")},7147:e=>{e.exports=require("fs")},1017:e=>{e.exports=require("path")},3837:e=>{e.exports=require("util")},1151:(e,r,o)=>{o.r(r),o.d(r,{originalPathname:()=>j,patchFetch:()=>x,requestAsyncStorage:()=>f,routeModule:()=>m,serverHooks:()=>y,staticGenerationAsyncStorage:()=>g});var n={};o.r(n),o.d(n,{POST:()=>c});var t=o(7092),s=o(5932),i=o(4147),a=o(7856),d=o(7147),l=o(1017),u=o(2081);let p=(0,o(3837).promisify)(u.exec);async function c(e){try{let{yamlContent:r}=await e.json(),o=(0,l.join)(process.cwd(),"temp"),n=(0,l.join)(o,"resume.yaml");(0,l.join)(o,"resume.pdf"),(0,d.existsSync)(o)||await p(`mkdir -p ${o}`);let t="/Users/arreyanhamid/Developer/ai-resume/designs",s=(0,l.join)(o,"designs");try{await p(`cp -r "${t}" "${o}/"`),console.log("Entire designs folder copied successfully"),console.log("Source:",t),console.log("Target:",s);let e=await p(`ls -la "${s}"`);console.log("Designs folder contents:",e.stdout)}catch(e){console.error("Error copying designs folder:",e)}(0,d.writeFileSync)(n,r);try{let e=`cd ${o} && rendercv render resume.yaml --design designs/engineeringClassic.yaml`;console.log("Executing command:",e),console.log("Working directory:",o);let r=await p(e);console.log("RenderCV stdout:",r.stdout),console.log("RenderCV stderr:",r.stderr);let n=(0,l.join)(o,"rendercv_output");(0,l.join)(n,"resume.pdf");let t=[(0,l.join)(n,"resume.pdf"),(0,l.join)(n,"John_Doe_CV.pdf"),(0,l.join)(n,"CV.pdf")],s=null,i=null;for(let e of t)if((0,d.existsSync)(e)){s=(0,d.readFileSync)(e),i=e;break}if(!s&&(0,d.existsSync)(n)){let e=await p(`find ${n} -name "*.pdf" | head -1`);if(e.stdout.trim()){let r=e.stdout.trim();s=(0,d.readFileSync)(r),i=r}}if(s)return console.log(`PDF found at: ${i}`),new a.NextResponse(s,{status:200,headers:{"Content-Type":"application/pdf","Content-Disposition":"inline; filename=resume.pdf"}});return console.error("No PDF found in rendercv_output directory"),a.NextResponse.json({error:"PDF generation failed - no output file found"},{status:500})}catch(r){console.error("RenderCV Error:",r);let e=`%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/Resources <<
/Font <<
/F1 4 0 R
>>
>>
/MediaBox [0 0 612 792]
/Contents 5 0 R
>>
endobj

4 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Times-Roman
>>
endobj

5 0 obj
<<
/Length 200
>>
stream
BT
/F1 12 Tf
72 720 Td
(Resume Preview - RenderCV Integration Pending) Tj
0 -20 Td
(Please install RenderCV to see full PDF output) Tj
0 -20 Td
(Command: pip install rendercv) Tj
ET
endstream
endobj

xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000079 00000 n 
0000000173 00000 n 
0000000301 00000 n 
0000000380 00000 n 
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
625
%%EOF`;return new a.NextResponse(e,{status:200,headers:{"Content-Type":"application/pdf","Content-Disposition":"inline; filename=resume.pdf"}})}}catch(e){return console.error("API Error:",e),a.NextResponse.json({error:"Internal server error"},{status:500})}}let m=new t.AppRouteRouteModule({definition:{kind:s.x.APP_ROUTE,page:"/api/render-resume/route",pathname:"/api/render-resume",filename:"route",bundlePath:"app/api/render-resume/route"},resolvedPagePath:"/Volumes/Crucible/resume-frontend-copy/resume-frontend/src/app/api/render-resume/route.ts",nextConfigOutput:"standalone",userland:n}),{requestAsyncStorage:f,staticGenerationAsyncStorage:g,serverHooks:y}=m,j="/api/render-resume/route";function x(){return(0,i.patchFetch)({serverHooks:y,staticGenerationAsyncStorage:g})}}};var r=require("../../../webpack-runtime.js");r.C(e);var o=e=>r(r.s=e),n=r.X(0,[111,965],()=>o(1151));module.exports=n})();