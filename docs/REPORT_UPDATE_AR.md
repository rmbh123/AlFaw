# تعديلات تقرير AlFaw بعد رفع الكود المعدل

هذه التعليمات تخص AlFaw_Revised_v5.docx. أرقام الصفحات هي أرقام نسخة v5 قبل التعديل؛ ستتغير بعد ضبط التباعد ونقل المراجع. ملفات الكود في هذا الزيب معدلة، أما تقرير Word نفسه فلم يُعدّل ضمن هذه المهمة.

## 1. رفع الملفات

فكي الزيب واستبدلي ملفات المشروع داخل مستودع GitHub الحالي بمحتويات مجلد AlFaw-main. ارفعي ملفات المصدر وREADME وAUTHORS ومجلدي docs وtests مع الصور والخطوط. حافظي على ملفات المشروع في جذر المستودع، دون إضافة مجلد AlFaw-main آخر داخل الجذر. احتفظي بروابط GitHub وJira الحالية في التقرير. إذا كان Vercel مرتبطًا بـGitHub، تحققي من اكتمال نشر الإصدار الجديد ثم اختبري الموقع؛ الزيب وحده لا يحدّث المستودع أو الموقع.

## 2. الفائز: تصحيح سطر واحد

المكان في v5: ص73، Pseudocode 4.4.2-c: Determine the winner.

استبدلي:

```text
winnerId = topBid.userId
```

بـ:

```text
winnerId = topBid.uid
```

الحقل uid هو الموجود في Class Diagram وجدول Bids وفي الكود.

## 3. توثيق إيصالات المزايدات

المكان الأول: قصة Place a bid، ص38. أضيفي إلى Acceptance Criteria:

- The buyer can view and print an informational receipt for each of their own recorded bids from the auction details page and their profile.
- The receipt shows the bid reference, auction, artifact, bidder, bid amount, and timestamp.
- The receipt is not a payment invoice, proof of purchase, or proof of winning.

المكان الثاني: Table 28: Pages of the AlFaw Website، ص79–80. استبدلي Purpose للصفين فقط:

Auction Details:

> Prices, countdown, bid form, bidding history, bidder ranking, auction result, winner review, and the buyer's informational bid receipts.

Profile:

> View and edit personal information; activity statistics; personal auction participation, reviews, informational bid receipts, and notifications.

أضيفي في 4.5.2 شرحًا قصيرًا:

> Buyers can view and print informational receipts for their own recorded bids from the auction details page and their profile. Receipts are generated from existing bid records and do not represent payments or completed purchases.

## 4. معايير إضافة وتعديل القطعة

المكان: قصة Add Artifact، ص43. أضيفي المعايير التالية؛ قصة Edit Artifact ص42 تحيل إلى قواعد الإضافة نفسها:

- Required fields are the artifact name, description, category, historical period, origin, condition, starting price, and a main image for a new artifact.
- The artifact name must contain at least 3 characters, the description must contain at least 20 characters, and the starting price must be greater than zero.
- A verification reference is required when the selected verification status is Verified.
- Images must be JPG, PNG, or WEBP. Supporting documents may be PDF, JPG, PNG, or WEBP. Each selected file must not exceed 50 MB.
- If a required field is missing, an input is invalid, or a file violates these rules, the system displays an error message and does not save the artifact.

احتفظي بمعيار نجاح الحفظ. حد 50 MB هو لكل ملف، وليس مجموع الملفات. النموذج المحلي يحفظ الصورة الرئيسية الأولى ويضغطها للعرض، والمستندات تحفظ محليًا في IndexedDB.

## 5. حذف القطعة وحفظ التاريخ

المكان: قصة Delete Artifact، ص41. أضيفي:

- Only the owner seller can delete an artifact.
- An artifact linked to an active or upcoming auction cannot be deleted. The system prevents deletion and explains the reason.
- After confirmation, the artifact is archived and removed from public catalogues. Its completed auction history, existing reviews, and informational bid receipts remain available through historical links.
- An eligible winner can still submit one review for a completed auction after the artifact is archived.

معايير التأكيد والإلغاء الموجودة تبقى. هذه القاعدة متفقة مع القسم 4.3 وشرح الأرشفة في 4.4 بعد إصلاح الكود.

## 6. وصف التخزين الحالي والتنقل

المكان: Current Sprint 1 Architecture، ص49–52. أضيفي إلى وصف التخزين المحلي وإلى الرسم الحالي مستودع IndexedDB للمستندات، مع الإبقاء على تصميم Firebase النهائي:

> The current prototype stores supporting document files locally in IndexedDB. User accounts, seller profiles, artifact records, compressed image previews, auctions, bids, reviews, and notices are stored in localStorage. These local records are not a cloud database and are not synchronized across devices.

المكان: 4.5.3 Navigation Rules، ص80–81. صححي وصف رابط الحساب وطريقة المنع باستخدام:

> After login, the account link opens profile.html. Sellers and administrators also receive navigation links to their respective dashboards. Restricted pages hide protected content and display an access message when the required role is absent. Bidding is enabled only for a logged-in buyer in an active auction.

التقرير الحالي يقول إن رابط حساب الأدمن يتحول إلى لوحة الإدارة وإن المنع يتم دائمًا بإعادة توجيه؛ الكود يعرض رابط الحساب الشخصي مع رابط مستقل للوحة الإدارة، ويعرض رسالة منع في الصفحات المحمية.

## 7. المراجع ومعلومات المنافسين

ص7: رقما قرابة 57,000 وأكثر من 6,400 يحتاجان مصدرين منفصلين عن خبر Pandora IX الموجود في [1]. أضيفي المصدرين التاليين إلى قائمة المراجع، وضعي الإحالة الملائمة بجانب كل رقم في النص وTable 1، ثم أعيدي ترقيم المراجع حسب أول ظهور:

INTERPOL, “Stolen Works of Art Database.” [Online]. Available: https://www.interpol.int/en/Crimes/Cultural-heritage-crime/Stolen-Works-of-Art-Database. [Accessed: Oct. 23, 2026].

INTERPOL, “85 arrests, 6,400 objects recovered in international operation against art trafficking,” Jul. 19, 2024. [Online]. Available: https://www.interpol.int/en/News-and-Events/News/2024/85-arrests-6-400-objects-recovered-in-international-operation-against-art-trafficking. [Accessed: Oct. 23, 2026].

ص13: احذفي الجملة التالية من Strengths الخاصة بـLiveAuctioneers ما لم تضيفي مصدرًا مباشرًا يدعمها:

> The website supports several languages, including Arabic.

المصدران الحاليان لا يثبتان دعم الموقع للعربية. لا تستبدليها بادعاء أن الموقع لا يدعم العربية دون دليل.

## 8. متطلبات التنسيق الصريحة

مقاطع pseudocode في v5 مضبوطة على Courier New بحجم10 وتباعد1.0. اجعليها Times New Roman بحجم12 وتباعد1.5، مع الاحتفاظ بالمسافات البادئة للشروط. بعض نصوص Tables 1 و2 و4 و8 أيضًا بحجم10؛ اجعليها12.

انقلي References كاملة إلى ما بعد Appendix B حتى تكون في نهاية المستند، وفق الدسكربشن.

حدّثي الفهارس وأرقام الصفحات بعد جميع التعديلات. حاليًا بند 4.2 Class Diagram يشير إلى ص53 بينما يبدأ في ص52. أرقام Tables 1–30 وFigures 1–25 نفسها متسلسلة في v5؛ حدّثي الإحالات عند تحريك الأقسام.

## 9. ما تم تطبيقه بالفعل ولا يحتاج إعادة تعديل

Figure 12 وخيارات الوقت ونسبها؛ Figure 13 ووضوح سياسة المزاد؛ Figure 14 و48.1% لكلتا اللغتين؛ الجنسية92.6%؛ participant under18؛ اتجاه أسهم extend إلى Browse؛ استقلال Seller عن Buyer؛ Review Winning Seller؛ Admin للعرض فقط؛ عدم جعل Heritage Commission ممثلًا مباشرًا؛ حد50 MB؛ وSecurity NFR القابل للقياس.

لا تضيفي قاعدة بيانات إلزامية لـSprint 1. Firebase Authentication وCloud Firestore وFirebase Storage مختارة للتصميم النهائي، ولم تدمج في هذا الزيب. ولا يلزم مخطط SQL أو data dictionary علائقي لتصميم Firestore.

## 10. قبل التسليم

تحققي من دعوة الدكتورة إلى Jira، ومن وجود قصة Manage Auctions ومعايير القصص المعدلة في الباكلوق المعتمد. صدّري PDF بعد ضبط الفهارس، وافحصي صفحاته، ثم استخدمي الاسم المطلوب: IT320_Release_Template_Phase3_Section#-Group[yourgroup#].pdf مع استبدال بيانات الشعبة والمجموعة الفعلية، وارفعيه على LMS في الموعد.
