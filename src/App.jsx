import { lazy, Suspense, useState } from 'react';
import Header from './components/Header.jsx';
import BsMenzCollection from './components/BsMenzCollection.jsx';
import CatalogPreview from './components/CatalogPreview.jsx';
import AboutUs from './components/AboutUs.jsx';
import { isFirebaseConfigured } from '@/lib/firebase.js';
const Marketplace = lazy(() => import('./components/Marketplace.jsx'));
const questions = [
  ['Can I order now?', 'Browse the collection and check the available sizes for each item. Ordering opens after final prices and delivery coverage are confirmed.'],
  ['Where will Q Fashion deliver?', 'We are preparing a local launch in Guwahati. Eligible neighbourhoods, delivery charges and operating hours will be published before ordering opens.'],
  ['How will delivery work?', 'Q Fashion will arrange a local courier to collect and deliver your order. Your account will show confirmed order stages and an estimated arrival window, without a live rider map.'],
  ['How is the delivery estimate calculated?', 'The estimate includes preparation, packaging, the courier’s arrival at the shop, travel to you, and a buffer. Traffic and shop readiness can change the estimate; the timer does not confirm delivery.'],
  ['How will payments work?', 'Checkout is online only. You pay for the items and local delivery together. The delivery fee is shown separately before payment. For the planned initial UPI flow, a submitted reference stays pending until Q Fashion confirms the actual bank credit. Never share your UPI PIN or bank OTP.'],
  ['How do I request a return or exchange?', 'Email qfashion.shop1@gmail.com with your order ID and item within 24 hours of delivery. Return the original garment you received, unwashed, with its tags attached and intact. We cannot accept substitutes. You pay the courier fee for a return or exchange. We will confirm the fee with you before arranging pickup. If you received a wrong or faulty item, contact us for help.'],
  ['Who is Q Fashion for?', 'Our collection welcomes shoppers of every age and gender.'],
];
export default function App({ user, role, onAccount, onLogout }) {
  const [panel, setPanel] = useState(null);
  const [accountTab, setAccountTab] = useState('profile');
  const openAccount = (tab = 'profile') => { setAccountTab(tab); document.getElementById('your-account')?.scrollIntoView({ behavior: 'smooth' }); };
  const accountAction = user ? () => openAccount() : onAccount;
  const openPanel = next => { if (user && next === 'orders') openAccount('orders'); else setPanel(next); };
  const [counts, setCounts] = useState({ saved: 0, bag: 0 });
  const [bagCount, setBagCount] = useState(0);
  return <div className="min-h-screen bg-canvas new-edit">
    <a className="skip-link" href="#main-content">Skip to content</a>
    <div className="launch-strip">GUWAHATI, WE’RE GETTING READY. <span>A new local fashion story.</span></div>
    <Header user={user} onAccount={accountAction} onLogout={onLogout} onPanel={openPanel} counts={{ ...counts, bag: bagCount }} />
    <main id="main-content">
      {user && <div id="your-account"><Suspense fallback={<p className="page-section" role="status">Opening your account…</p>}><Marketplace user={user} role={role} activeTab={accountTab} onTabChange={setAccountTab} /></Suspense></div>}
      <section className="launch-hero" aria-labelledby="hero-title">
        <div className="launch-copy"><p className="eyebrow">Q FASHION / THE NEIGHBOURHOOD EDIT</p><h1 id="hero-title">Good style.<br />Closer to <em>home.</em></h1><p>A fresh perspective on the shops around you.<br />Made for your everyday. Inspired by Guwahati.</p><div className="hero-actions"><a href="#collection" className="btn-primary">Explore the collection ↗</a><button className="btn-quiet" onClick={user ? () => document.getElementById('your-account')?.scrollIntoView({ behavior: 'smooth' }) : onAccount}>{user ? 'Open my account' : isFirebaseConfigured ? 'Join Q Fashion' : 'Account preview'} →</button></div><div className="launch-note"><span className="launch-dot" /> Ordering coming soon</div></div>
        <figure className="launch-art">
          <img src="/qfashion-streetwear-hero.jpg" alt="A man and a woman wearing oversized tees, sportswear and caps" fetchPriority="high" />
          <figcaption>AI-generated styling inspiration</figcaption>
        </figure>
      </section>
      <div className="values-strip"><span>LOCAL DISCOVERIES</span><span aria-hidden="true">✳</span><span>PERSONAL SUPPORT</span><span aria-hidden="true">✳</span><span>THOUGHTFUL DELIVERY</span></div>
      <BsMenzCollection bagOpen={panel === 'bag'} onOpenBag={() => setPanel('bag')} onCloseBag={() => setPanel(null)} onBagCount={setBagCount} />
      <CatalogPreview panel={panel === 'bag' ? null : panel} onPanel={setPanel} onCounts={setCounts} onAccount={onAccount} hideCollection />
      <section className="delivery-story" id="delivery"><div><p className="eyebrow">FROM A LOCAL SHOP TO YOUR DOOR</p><h2>A personal touch.<br /><em>Every step of the way.</em></h2><p>We’re building delivery around clear updates and a person you can reach. Your order will move forward when each step is confirmed.</p><a href="#questions" className="text-sm underline underline-offset-4">How delivery will work →</a></div><ol className="delivery-steps">{[['01', 'Made ready for you', 'Preparation and packaging at the shop.'], ['02', 'Collected with care', 'Q Fashion arranges a local courier for pickup.'], ['03', 'On its way home', 'An estimated arrival window and confirmed order updates.']].map(([number, title, copy]) => <li key={number}><span>{number}</span><div><h3>{title}</h3><p>{copy}</p></div></li>)}</ol></section>

      <section id="questions" className="page-section faq-section"><div><p className="eyebrow">BEFORE WE BEGIN</p><h2>A little more<br /><em>about Q.</em></h2><p>Something else on your mind?</p><a href="mailto:qfashion.shop1@gmail.com" className="btn-ghost mt-4">Talk to us ↗</a></div><div>{questions.map(([question, answer]) => <details key={question}><summary>{question}<span aria-hidden="true">+</span></summary><p>{answer}</p></details>)}</div></section>
      <section id="ordering-guide" className="page-section" aria-labelledby="ordering-guide-title">
        <div className="section-heading"><div><p className="eyebrow">SHOPPING WITH Q FASHION</p><h2 id="ordering-guide-title">How to <em>order.</em></h2></div><p>Browse and build an estimate now. Online orders open after delivery and payment setup is complete.</p></div>
        <ol className="grid gap-4 md:grid-cols-3">
          <li className="card p-5"><h3 className="font-bold">Choose your size</h3><p className="text-sm mt-2">Open a product and swipe through its photos. Select an available size and add it to your basket estimate.</p></li>
          <li className="card p-5"><h3 className="font-bold">Check the total</h3><p className="text-sm mt-2">The estimate shows item prices, GST and platform fees. Delivery is ₹100 for one item and free for two or more.</p></li>
          <li className="card p-5"><h3 className="font-bold">Confirm delivery before paying</h3><p className="text-sm mt-2">Open your bag to preview the delivery address step. You’ll review your final total before paying online when orders open.</p></li>
        </ol>
        <a href="#collection" className="btn-primary mt-6">Back to the collection</a>
      </section>
    </main>
    <AboutUs />
  </div>;
}
