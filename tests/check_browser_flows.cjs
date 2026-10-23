// Optional local browser regression tests. See README for setup.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const {chromium} = require(process.env.ALFAW_PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '..');
const mime = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css','.jpg':'image/jpeg','.png':'image/png','.ttf':'font/ttf','.ico':'image/x-icon'};
const server = http.createServer((req,res)=>{
  const pathname = decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const file = path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
  if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return}
  fs.readFile(file,(error,data)=>{if(error){res.writeHead(404).end();return}res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(data)});
});
let browser;
const passed=[];
function pass(name){passed.push(name);console.log('PASS',name)}
(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const origin='http://127.0.0.1:'+server.address().port;
  browser=await chromium.launch({headless:true,executablePath:process.env.ALFAW_CHROMIUM_EXECUTABLE||undefined,args:['--no-sandbox','--disable-dev-shm-usage','--no-zygote','--single-process','--in-process-gpu','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-features=Vulkan']});
  const context=await browser.newContext({reducedMotion:'reduce',viewport:{width:1366,height:900}});
  await context.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
  const page=await context.newPage();
  page.setDefaultTimeout(10000);
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const go=async url=>{await page.goto(origin+'/'+url,{waitUntil:'load'});};
  const read=async key=>page.evaluate(k=>JSON.parse(localStorage.getItem('alfaw_phase3_'+k)||'null'),key);
  const login=async(email,password,admin=false)=>{
    await go(admin?'admin-login.html':'login.html');
    await page.waitForFunction(()=>JSON.parse(localStorage.getItem('alfaw_phase3_users')||'[]').filter(u=>u.demo).every(u=>u.passwordHash));
    await page.locator('#login-email').fill(email);await page.locator('#login-password').fill(password);
    await page.locator('#login-form button[type=submit]').click();
  };
  const logout=async()=>{await go('profile.html');await page.locator('#profile-logout-button').click();await page.waitForURL('**/login.html');};
  const localDate=ms=>{const d=new Date(ms);return new Date(ms-d.getTimezoneOffset()*60000).toISOString().slice(0,16)};
  // Every submitted HTML file must load without a script exception.
  for(const file of fs.readdirSync(root).filter(x=>x.endsWith('.html'))){
    await go(file);assert(!/404|not found/i.test(await page.title()),file);
  }
  assert.deepEqual(errors,[]);pass('All 18 HTML routes load without JavaScript exceptions');
  // Login data in README must be usable (all three roles).
  for(const [role,email,destination] of [['buyer','buyer@alfaw.demo','profile.html'],['seller','seller@alfaw.demo','seller-dashboard.html'],['admin','admin@alfaw.demo','admin-dashboard.html']]){
    await login(email,'wrong-password',role==='admin');assert.equal(await read('session'),null);
    await login(email,'AlfawDemo!2026',role==='admin');await page.waitForURL('**/'+destination);assert.equal((await read('session')).role,role);
    await logout();
  }
  pass('README demo accounts: wrong passwords rejected; all roles login and logout');
  // Register through the real form, without seeding a session.
  await go('register.html');await page.locator('input[name=accountType][value=seller]').check();
  await page.locator('#register-full-name').fill('QA Seller');await page.locator('#register-email').fill('qa.seller@example.test');
  await page.locator('#register-phone').fill('0512345678');await page.locator('#register-city').selectOption('riyadh');
  await page.locator('#register-store-name').fill('QA Store');await page.locator('#register-password').fill('QaSeller!2026');await page.locator('#register-confirm-password').fill('QaSeller!2026');
  await page.locator('#register-terms').check();await page.locator('#register-submit-button').click();
  await page.locator('#alfaw-registration-success').waitFor({state:'visible'});
  await login('qa.seller@example.test','QaSeller!2026');await page.waitForURL('**/seller-dashboard.html');
  const sellerSession=await read('session');pass('Seller registration and login via actual forms');
  await go('profile.html');await page.locator('[data-profile-tab=personal]').click();
  await page.locator('#profile-full-name').fill('QA Seller Updated');await page.locator('#profile-phone').fill('0512345678');await page.locator('#profile-city').selectOption('riyadh');
  await page.locator('#profile-edit-form button[type=submit]').click();
  assert.equal((await read('users')).find(u=>u.id===sellerSession.id).name,'QA Seller Updated');pass('Profile updates persist');
  await go('manage-artifact.html');
  await page.locator('#artifact-name').fill('QA Artifact');await page.locator('#artifact-category').selectOption('coins');
  await page.locator('#artifact-period').fill('Historical period');await page.locator('#artifact-description').fill('A complete historical artifact description used only for local testing.');
  await page.locator('#artifact-origin').fill('Riyadh');await page.locator('#artifact-condition').selectOption('good');await page.locator('#artifact-starting-price').fill('100');
  await page.locator('#artifact-images').setInputFiles(path.join(root,'coin.jpg'));
  await page.locator('#artifact-documents').setInputFiles(path.join(root,'coin.jpg'));
  await page.locator('#manage-artifact-form button[type=submit]').click();await page.waitForURL('**/seller-dashboard.html');
  const item=(await read('artifacts')).find(x=>x.name==='QA Artifact');assert(item);assert.equal(item.documents.length,1);assert(item.documents[0].storageKey);
  await go('browse.html');assert.equal(await page.locator('.browse-artifact-card').filter({hasText:'QA Artifact'}).count(),1);
  await page.locator('#artifact-search-input').fill('QA Artifact');
  await page.getByRole('button',{name:'بحث',exact:true}).click();assert.equal(await page.locator('.browse-artifact-card:visible').count(),1);
  await go('artifact-detail.html?id='+item.id);
  const downloadPromise=page.waitForEvent('download');await page.locator('#artifact-document-list a').click();const download=await downloadPromise;assert.equal(download.suggestedFilename(),'coin.jpg');
  pass('Add artifact, image/doc persistence, public browse/search and document download');
  await go('manage-artifact.html?id='+item.id);await page.locator('#artifact-name').fill('QA Edited Artifact');await page.locator('#manage-artifact-form button[type=submit]').click();await page.waitForURL('**/seller-dashboard.html');
  await go('browse.html');assert.equal(await page.locator('.browse-artifact-card').filter({hasText:'QA Edited Artifact'}).count(),1);pass('Edited artifact data reaches Browse');
  await go('manage-auctions.html');await page.locator('#auction-artifact-select').selectOption(item.id);
  await page.locator('#auction-starting-price-input').fill('100');await page.locator('#auction-min-increment-input').fill('10');await page.locator('#auction-reserve-price-input').fill('100');
  let now=Date.now();await page.locator('#auction-start-date').fill(localDate(now-3600000));await page.locator('#auction-end-date').fill(localDate(now+7200000));
  await page.locator('#manage-auction-form button[type=submit]').click();assert(!(await read('auctions')).some(a=>a.artifactId===item.id));
  await page.locator('#auction-start-date').fill(localDate(now+3600000));await Promise.all([page.waitForNavigation({waitUntil:'load'}),page.locator('#manage-auction-form button[type=submit]').click()]);
  await page.waitForFunction(id=>JSON.parse(localStorage.getItem('alfaw_phase3_auctions')||'[]').some(a=>a.artifactId===id),item.id);
  let auction=(await read('auctions')).find(a=>a.artifactId===item.id);assert(auction);
  await go('seller-dashboard.html');assert(await page.locator('[data-delete-artifact="'+item.id+'"]').isDisabled());
  pass('Auction creation validates future dates; upcoming auctions block artifact deletion');
  // Deterministic clock fixture: change only this test auction's schedule, not bids or accounts.
  await page.evaluate(id=>{const a=JSON.parse(localStorage.getItem('alfaw_phase3_auctions'));const x=a.find(x=>x.id===id);x.start=new Date(Date.now()-3600000).toISOString();x.end=new Date(Date.now()+3600000).toISOString();localStorage.setItem('alfaw_phase3_auctions',JSON.stringify(a))},auction.id);
  await logout();await login('buyer@alfaw.demo','AlfawDemo!2026');await page.waitForURL('**/profile.html');
  await go('auction-detail.html?id='+auction.id);assert(await page.locator('#bid-amount').isEnabled());
  const initialMinimum=await page.locator('#auction-next-minimum').innerText();assert((await page.locator('#bid-minimum-hint').innerText()).includes(initialMinimum));
  await page.locator('#bid-amount').fill('100');await page.locator('#place-bid-form button[type=submit]').click();assert.equal((await read('auctions')).find(a=>a.id===auction.id).bids.length,0);
  await page.locator('#bid-amount').fill('110');await page.locator('#place-bid-form button[type=submit]').click();assert.equal((await read('auctions')).find(a=>a.id===auction.id).bids.length,1);
  const nextMinimum=await page.locator('#auction-next-minimum').innerText();assert((await page.locator('#bid-minimum-hint').innerText()).includes(nextMinimum));
  await page.locator('#auction-my-receipts button').first().click();assert(await page.locator('.alfaw-receipt-overlay').isVisible());assert((await page.locator('.alfaw-receipt-overlay .alfaw-receipt').innerText()).includes(auction.id));
  await page.emulateMedia({media:'print'});assert.equal(await page.locator('.alfaw-receipt-overlay').evaluate(el=>getComputedStyle(el).visibility),'visible');assert((await page.pdf()).length>1000);await page.emulateMedia({media:'screen'});
  await page.locator('.alfaw-receipt-actions button').filter({hasText:'إغلاق'}).click();
  await go('profile.html');await page.locator('[data-profile-tab=invoices]').click();assert.equal(await page.locator('#profile-invoices-list button').count(),1);
  pass('Bid validation, updated minimum, history and personal receipt interfaces');
  // End the test auction, then use the real seller archive control.
  await page.evaluate(id=>{const a=JSON.parse(localStorage.getItem('alfaw_phase3_auctions'));a.find(x=>x.id===id).end=new Date(Date.now()-1000).toISOString();localStorage.setItem('alfaw_phase3_auctions',JSON.stringify(a))},auction.id);
  await logout();await login('qa.seller@example.test','QaSeller!2026');await page.waitForURL('**/seller-dashboard.html');
  await page.locator('[data-delete-artifact="'+item.id+'"]').click();await page.locator('#dashboard-confirm-delete').click();assert((await read('artifacts')).find(x=>x.id===item.id).archived);
  await go('browse.html');assert.equal(await page.locator('.browse-artifact-card').filter({hasText:'QA Edited Artifact'}).count(),0);
  await go('auctions.html');assert.equal(await page.locator('a[href="auction-detail.html?id='+auction.id+'"]').count(),0);
  await go('artifact-detail.html?id='+item.id);assert(page.url().includes('artifact-detail.html'));assert.equal(await page.locator('#artifact-detail-title').innerText(),'QA Edited Artifact');
  await logout();await login('buyer@alfaw.demo','AlfawDemo!2026');await page.waitForURL('**/profile.html');await go('auction-detail.html?id='+auction.id);
  assert(page.url().includes('auction-detail.html'));assert(await page.locator('#auction-review-section').isVisible());
  await page.locator('#auction-receipt-confirmed').check();await page.locator('#auction-review-rating').selectOption('5');await page.locator('#auction-review-comment').fill('QA winner review');
  await page.locator('#auction-review-form button[type=submit]').click();assert.equal((await read('reviews')).filter(r=>r.auctionId===auction.id).length,1);assert(await page.locator('#auction-review-section').isHidden());
  await go('seller-detail.html?id='+sellerSession.sellerId);assert((await page.locator('#seller-detail-trust-score').innerText()).includes('100'));
  pass('Archive hides listing; historical details and winner review/Trust Score remain usable');
  await go('admin-dashboard.html');assert(await page.locator('#admin-dashboard-content').isHidden());assert(await page.locator('#admin-dashboard-access-message').isVisible());
  await go('seller-dashboard.html');assert(await page.locator('#seller-dashboard-content').isHidden());pass('Buyer cannot access seller or admin dashboard content');
  assert.deepEqual(errors,[]);pass('No uncaught JavaScript errors in tested workflows');
  console.log('PASS:',passed.length,'browser checks');
})().catch(error=>{console.error(error.stack);process.exitCode=1}).finally(async()=>{if(browser)await browser.close();server.close()});
