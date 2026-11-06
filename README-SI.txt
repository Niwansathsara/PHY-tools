PHY TOOLS — GITHUB PAGES PACKAGE
Created by G.Niwan Sathsara
Contact: gnsclasslibrary@gmail.com

මෙම ZIP එකේ built-in simulation 130ම index.html එක තුළම ඇතුළත් කර ඇත. වෙන වෙනම tools/ folders 130ක් upload කිරීම අවශ්‍ය නැත.

1) GITHUB වෙත upload කිරීම
- ZIP එක extract කරන්න.
- Extract කළ folder එක ඇතුළේ ඇති සියලුම files/folders repository root එකට upload කරන්න.
- index.html එක repository root එකේ තිබිය යුතුය. `PHY-Tools-GitHub-Ready/PHY-Tools-GitHub-Ready/index.html` වැනි nested folder එකක් තුළ නොතබන්න.
- Repository root එකේ index.html, admin.html, tools.html, about.html, 404.html, css/, data/, js/, firebase/ සහ README-SI.txt පෙනිය යුතුය.
- GitHub Settings > Pages > Build and deployment > Source: Deploy from a branch තෝරන්න.
- Branch: main සහ Folder: /(root) තෝරා Save කරන්න.
- මෙම ZIP එකේ .github/workflows folder එකක් නැත. ඒ නිසා Pages branch deployment එක සහ Actions workflow deployment එක එකවර ක්‍රියාත්මක නොවේ.
- Website URL: https://niwansathsara.github.io/PHY-tools/

2) FIREBASE Auth සකස් කිරීම
- Firebase Console හි phy-tools project එක විවෘත කරන්න.
- Authentication > Sign-in method යටතේ Anonymous සහ Google යන providers දෙකම Enable කරන්න.
- Authentication > Settings > Authorized domains යටතේ niwansathsara.github.io තිබේද බලන්න; නැත්නම් add කරන්න.
- Google provider එකේ support email එක තෝරන්න.

3) FIRESTORE සකස් කිරීම
- Firestore Database එක create කරගන්න.
- Firestore > Rules යටතේ මෙම ZIP එකේ firebase/firestore.rules හි අන්තර්ගතය paste කර Publish කරන්න.
- Public visitors සඳහා visible login prompt එකක් නැත. Site එක Firebase Anonymous Authentication භාවිත කර visitor counters සහ admin-added units/tools read කරයි. Built-in tools Firebase නොමැතිවත් පෙන්විය යුතුය.

4) ADMIN ACCESS
- https://niwansathsara.github.io/PHY-tools/admin.html විවෘත කරන්න.
- Google sign-in කරන්නේ niwansathsara76@gmail.com verified account එකෙන් පමණි.
- Admin page එකෙන් additional syllabus units හා standalone HTML simulations add/edit/delete කළ හැක.
- Built-in 130 simulations ආරක්ෂා කර ඇත. Built-in unit එකක් edit කළ හැකි අතර Reset කිරීමෙන් original details නැවත ලැබේ.
- Uploaded HTML එකක් 800 KB ට අඩු විය යුතුය. එය Firestore document එකක් ලෙස සුරැකේ.

5) ONLINE / TOTAL VISITORS
- Public page එකට anonymous Firebase session එකක් භාවිතා කර unique visitor record එකක් ලියයි.
- Online count එක last 90 seconds තුළ heartbeat ලබාදුන් browsers ගණන් කරයි; heartbeat එක තත්පර 30කට වරක් යාවත්කාලීන වේ.
- Total visitors යනු Firestore siteVisitors collection එකේ browser IDs ගණනයි.

6) වැදගත්
- index.html එකේ built-in simulations 130ම සහ Boyle’s Law original 3D simulation එක embedded වේ. අනෙක් tools සඳහා 3D scene engine එක shared වේ; ඒවා එකිනෙක වෙනස් physics lesson model types අනුව පරාමිතීන් ලබා ගනී. සියලුම 130 tools විෂය කරුණු අනුව එකින් එක විද්‍යාත්මකව ස්වාධීනව validate කර ඇති බවක් මෙම package එකෙන් අදහස් නොවේ.
- Three.js 3D graphics සඳහා Internet සම්බන්ධතාවය සහ WebGL-enabled browser එකක් අවශ්‍ය වේ.
- Firebase web API key එක browser config එකේ පෙනීම සාමාන්‍ය දෙයකි. Firestore Rules තමයි database permissions ආරක්ෂා කරන්නේ. Service-account/private key කිසිවිටෙක browser එකට upload නොකරන්න.
- Google/Firebase Authentication සහ Firestore providers/rules සකස් නොකළහොත් built-in 130 simulations තවමත් පෙන්විය යුතුය; නමුත් admin upload හා visitor stats වැඩ නොකරනු ඇත.
