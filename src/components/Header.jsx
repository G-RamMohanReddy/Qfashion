export default function Header({ user, onAccount, onLogout }) {
  return <header className="store-header"><a href="/" className="store-wordmark" aria-label="Q Fashion home">Q<span>FASHION<small>THE NEIGHBOURHOOD EDIT</small></span></a><nav aria-label="Main navigation"><a href="#the-edit">The edit</a><a href="#delivery">Delivery</a><a href="#about-us">Our story</a><a href="#questions">FAQs</a></nav><button className="header-account" onClick={user ? onLogout : onAccount}>{user ? 'Sign out' : 'Sign in'} ↗</button></header>;
}
