import { lazy, Suspense, useState } from 'react';
import Header from './components/Header.jsx';
import BsMenzCollection from './components/BsMenzCollection.jsx';
import CatalogPreview from './components/CatalogPreview.jsx';
import AboutUs from './components/AboutUs.jsx';
import { isFirebaseConfigured } from '@/lib/firebase.js';
const Marketplace = lazy(() => import('./components/Marketplace.jsx'));
const edits = [
  { name: 'The everyday edit', note: 'Easy layers. Uncomplicated days.', kind: 'shirt', tone: 'sage', tag: '01 / EVERYDAY' },
  { name: 'A little occasion', note: 'For the moments you dress up for.', kind: 'dress', tone: 'clay', tag: '02 / OCCASION' },
  { name: 'Finishing touches', note: 'Small details. Your signature.', kind: 'bag', tone: 'sand', tag: '03 / DETAILS' },
];
const questions = [
  ['Can I order now?', 'Browse the BS Menz Shop collection and view the available size range. Ordering opens after final prices and delivery coverage are confirmed.'],
  ['Where will Q Fashion deliver?', 'We are preparing a local launch in Guwahati. Eligible neighbourhoods, delivery charges and operating hours will be published before ordering opens.'],
  ['How will delivery work?', 'Q Fashion will arrange a local courier to collect and deliver your order. Your account will show confirmed order stages and an estimated arrival window, without a live rider map.'],
  ['How is the delivery estimate calculated?', 'The estimate includes preparation, packaging, the courier’s arrival at the shop, travel to you, and a buffer. Traffic and shop readiness can change the estimate; the timer does not confirm delivery.'],
  ['How will payments work?', 'Checkout is online only. You pay for the items and local delivery together. The delivery fee is shown separately before payment. For the planned initial UPI flow, a submitted reference stays pending until Q Fashion confirms the actual bank credit. Never share your UPI PIN or bank OTP.'],
  ['How do I request a return or exchange?', 'Email qfashion.shop1@gmail.com with your order ID and item within 24 hours of delivery. Return the original garment you received, unwashed, with its tags attached and intact. We cannot accept substitutes. You pay the courier fee for a return or exchange. We will confirm the fee with you before arranging pickup. If you received a wrong or faulty item, contact us for help.'],
  ['Who is Q Fashion for?', 'Our collection welcomes shoppers of every age and gender.'],
];
function Garment({ kind = 'shirt' }) {
  return <svg viewBox="0 0 320 360" fill="none" aria-hidden="true" className={'garment garment-' + kind}>
    <ellipse cx="160" cy="325" rx="93" ry="13" fill="currentColor" opacity=".09" />
    {kind === 'shirt' ? <g stroke="currentColor" strokeWidth="2"><path d="M113 69 76 83 28 146 76 181 97 154 88 298Q160 314 232 298L223 154 244 181 292 146 244 83 207 69Q160 91 113 69Z" fill="currentColor" fillOpacity=".17" /><path d="m113 69 26 44 21-25 21 25 26-44M160 90v213M109 145h32v35h-32zM76 83l21 71M244 83l-21 71" opacity=".65" /><path d="M168 138h1m-1 34h1m-1 34h1m-1 34h1m-1 34h1" strokeWidth="4" strokeLinecap="round" /></g> : kind === 'dress' ? <g stroke="currentColor" strokeWidth="2"><path d="m122 63-20 8-38 70 35 19 19-32 11 51-47 123q78 28 156 0l-47-123 11-51 19 32 35-19-38-70-20-8q-38 44-76 0Z" fill="currentColor" fillOpacity=".17" /><path d="M129 179h62M144 183l-26 119m42-119v130m16-130 26 119M122 63q38 62 76 0" opacity=".55" /></g> : <g stroke="currentColor" strokeWidth="2"><path d="M110 143v-32a50 50 0 0 1 100 0v32m-85 0v-32a35 35 0 0 1 70 0v32" /><path d="m86 138-15 161q89 25 178 0l-15-161Z" fill="currentColor" fillOpacity=".17" /><path d="M87 158h146M92 288q68 17 136 0M160 193v40m-20-20h40" opacity=".6" /></g>}
  </svg>;
}
export default function App({ user, role, onAccount, onLogout }) {
  const [panel, setPanel] = useState(null);
  const [accountTab, setAccountTab] = useState('profile');
  const openAccount = (tab = 'profile') => { setAccountTab(tab); document.getElementById('your-account')?.scrollIntoView({ behavior: 'smooth' }); };
  const accountAction = user ? () => openAccount() : onAccount;
  const openPanel = next => { if (user && next === 'orders') openAccount('orders'); else setPanel(next); };
  const [counts, setCounts] = useState({ saved: 0, bag: 0 });
  return <div className="min-h-screen bg-canvas new-edit">
    <a className="skip-link" href="#main-content">Skip to content</a>
    <div className="launch-strip">GUWAHATI, WE’RE GETTING READY. <span>A new local fashion story.</span></div>
    <Header user={user} onAccount={accountAction} onLogout={onLogout} onPanel={openPanel} counts={counts} />
    <main id="main-content">
      {user && <div id="your-account"><Suspense fallback={<p className="page-section" role="status">Opening your account…</p>}><Marketplace user={user} role={role} activeTab={accountTab} onTabChange={setAccountTab} /></Suspense></div>}
      <section className="launch-hero" aria-labelledby="hero-title">
        <div className="launch-copy"><p className="eyebrow">Q FASHION / THE NEIGHBOURHOOD EDIT</p><h1 id="hero-title">Good style.<br />Closer to <em>home.</em></h1><p>A fresh perspective on the shops around you.<br />Made for your everyday. Inspired by Guwahati.</p><div className="hero-actions"><a href="#collection" className="btn-primary">Explore the collection ↗</a><button className="btn-quiet" onClick={user ? () => document.getElementById('your-account')?.scrollIntoView({ behavior: 'smooth' }) : onAccount}>{user ? 'Open my account' : isFirebaseConfigured ? 'Join Q Fashion' : 'Account preview'} →</button></div><div className="launch-note"><span className="launch-dot" /> BS Menz Shop collection · Ordering coming soon</div></div>
        <div className="launch-art"><span className="art-index">THE FIRST CHAPTER / 01</span><span className="art-orbit" /><Garment /><span className="art-script">a little local,<br />a lot you.</span><span className="art-caption">AN ILLUSTRATED STYLE STUDY · NOT A PRODUCT FOR SALE</span></div>
      </section>
      <div className="values-strip"><span>LOCAL DISCOVERIES</span><span aria-hidden="true">✳</span><span>PERSONAL SUPPORT</span><span aria-hidden="true">✳</span><span>THOUGHTFUL DELIVERY</span></div>
      <BsMenzCollection />
      <CatalogPreview panel={panel} onPanel={setPanel} onCounts={setCounts} onAccount={onAccount} hideCollection />
      <section id="the-edit" className="page-section">
        <div className="section-heading"><div><p className="eyebrow">A GLIMPSE OF WHAT’S NEXT</p><h2>Find your kind of <em>everyday.</em></h2></div><p>Three moods. Plenty of possibilities.<br />A style preview while we curate the collection.</p></div>
        <div className="edit-grid">{edits.map(edit => <article key={edit.kind} className={'edit-card ' + edit.tone}><div className="edit-illustration"><span className="eyebrow">{edit.tag}</span><Garment kind={edit.kind} /><span className="illustration-label">STYLE ILLUSTRATION</span></div><div className="edit-caption"><h3>{edit.name}</h3><p>{edit.note}</p></div></article>)}</div>
        <p className="collection-note">These illustrations are styling inspiration. Browse the BS Menz Shop collection above.</p>
      </section>
      <section className="delivery-story" id="delivery"><div><p className="eyebrow">FROM A LOCAL SHOP TO YOUR DOOR</p><h2>A personal touch.<br /><em>Every step of the way.</em></h2><p>We’re building delivery around clear updates and a person you can reach. Your order will move forward when each step is confirmed.</p><a href="#questions" className="text-sm underline underline-offset-4">How delivery will work →</a></div><ol className="delivery-steps">{[['01', 'Made ready for you', 'Preparation and packaging at the shop.'], ['02', 'Collected with care', 'Q Fashion arranges a local courier for pickup.'], ['03', 'On its way home', 'An estimated arrival window and confirmed order updates.']].map(([number, title, copy]) => <li key={number}><span>{number}</span><div><h3>{title}</h3><p>{copy}</p></div></li>)}</ol></section>

      <section id="questions" className="page-section faq-section"><div><p className="eyebrow">BEFORE WE BEGIN</p><h2>A little more<br /><em>about Q.</em></h2><p>Something else on your mind?</p><a href="mailto:qfashion.shop1@gmail.com" className="btn-ghost mt-4">Talk to us ↗</a></div><div>{questions.map(([question, answer]) => <details key={question}><summary>{question}<span aria-hidden="true">+</span></summary><p>{answer}</p></details>)}</div></section>
      <section id="ordering-guide" className="page-section" aria-labelledby="ordering-guide-title">
        <div className="section-heading"><div><p className="eyebrow">SHOPPING WITH Q FASHION</p><h2 id="ordering-guide-title">How to <em>order.</em></h2></div><p>Browse and build an estimate now. Online orders open after delivery and payment setup is complete.</p></div>
        <ol className="grid gap-4 md:grid-cols-3">
          <li className="card p-5"><h3 className="font-bold">Choose your size</h3><p className="text-sm mt-2">Open a BS Menz item and swipe through its photos. Select an available size and add it to your basket estimate.</p></li>
          <li className="card p-5"><h3 className="font-bold">Check the total</h3><p className="text-sm mt-2">The estimate shows item prices, GST and platform fees. Delivery is ₹100 for one item and free for two or more.</p></li>
          <li className="card p-5"><h3 className="font-bold">Confirm delivery before paying</h3><p className="text-sm mt-2">When checkout opens, enter your delivery address and review the final total before paying online.</p></li>
        </ol>
        <a href="#collection" className="btn-primary mt-6">Back to the BS Menz collection</a>
      </section>
    </main>
    <AboutUs />
  </div>;
}
