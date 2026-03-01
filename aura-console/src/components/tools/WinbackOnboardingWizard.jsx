// aura-console/src/components/tools/WinbackOnboardingWizard.jsx
// Enhanced onboarding wizard for Abandoned Checkout Winback
import React from 'react';

export default function WinbackOnboardingWizard({ onComplete }) {
 const [step, setStep] = React.useState(0);
 const steps = [
 {
 title: 'Welcome',
 content: 'Welcome to the Abandoned Checkout Winback tool! Lets get you set up to recover more revenue.'},
 {
 title: 'Connect Shopify',
 content: 'Connect your Shopify store to automatically sync abandoned checkouts.'},
 {
 title: 'Create Your First Campaign',
 content: 'Build your first winback campaign using our AI-powered template generator.'},
 {
 title: 'Enable Real-Time Analytics',
 content: 'Monitor campaign performance and get instant notifications for every recovery.'},
 {
 title: 'Youre Ready!',
 content: 'Youre all set! Launch your campaign and watch your revenue grow.'}
 ];
 return (
 <div>
 <h3 style={{ fontWeight: 800, fontSize: 26, marginBottom: 12 }}>{steps[step].title}</h3>
 <div style={{ fontSize: 17, marginBottom: 24 }}>{steps[step].content}</div>
 <div style={{ display: 'flex', justifyContent: 'space-between'}}>
 <button onClick={() => setStep(s =>Math.max(0, s - 1))} disabled={step === 0} style={{ background: 'var(--button-tertiary-bg)', color: 'var(--button-tertiary-text)', border: 'none', borderRadius: 8, padding: '8px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer'}}>Back</button>
 {step < steps.length - 1 ? (
 <button onClick={() => setStep(s => s + 1)} style={{ background: 'var(--button-primary-bg)', color: 'var(--button-primary-text)', border: 'none', borderRadius: 8, padding: '8px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer'}}>Next</button>
 ) : (
 <button onClick={onComplete} style={{ background: 'var(--button-success-bg)', color: 'var(--button-success-text)', border: 'none', borderRadius: 8, padding: '8px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer'}}>Finish</button>
 )}
 </div>
 </div>
 );
}
