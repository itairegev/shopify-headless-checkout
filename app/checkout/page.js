'use client'

import { useState } from "react";
import Image from "next/image";
import { redirect } from 'next/navigation'
import { countries } from '../utils/countries';

export default function CheckoutPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    country: "US",
    postalCode: "",
    cardNumber: "",
    subscriptionPlan: "one-time"
  });
  
  const [errors, setErrors] = useState({
    name: false,
    email: false,
    postalCode: false,
    cardNumber: false
  });

  const BASE_PRICE = 19.99;
  const SUBSCRIPTION_ADJUSTMENTS = {
    monthly: 0.10, // 10% off
    yearly: 0.20  // 20% off
  };

  const subscriptionPlans = [
    { 
      id: "one-time", 
      label: "One-time purchase", 
      price: `$${BASE_PRICE.toFixed(2)}`,
      description: "Single payment, lifetime access to the product"
    },
    { 
      id: "monthly", 
      label: "Monthly subscription", 
      price: `$${(BASE_PRICE * (1 - SUBSCRIPTION_ADJUSTMENTS.monthly)).toFixed(2)}/month`, 
      savings: `${SUBSCRIPTION_ADJUSTMENTS.monthly * 100}%`,
      description: "Flexible monthly billing with cancel anytime option"
    },
    { 
      id: "annual", 
      label: "Annual subscription", 
      price: `$${(BASE_PRICE * (1 - SUBSCRIPTION_ADJUSTMENTS.yearly)).toFixed(2)}/month`, 
      savings: `${SUBSCRIPTION_ADJUSTMENTS.yearly * 100}%`,
      description: "Best value! Annual billing with two months free"
    }
  ];

  // Validation functions
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateCardNumber = (number) => {
    // Remove any spaces or dashes
    const cleanNumber = number.replace(/[\s-]/g, '');
    // Check if it contains only digits and has length between 13-19 (standard card lengths)
    return /^\d{13,19}$/.test(cleanNumber);
  };

  const validatePostalCode = (code) => {
    return /^\d+$/.test(code);
  };

  const validateName = (name) => {
    return name.trim().length > 0;
  };

  const isFormValid = () => {
    return validateEmail(form.email) &&
           validateName(form.name) &&
           validatePostalCode(form.postalCode) &&
           validateCardNumber(form.cardNumber) &&
           !isSubmitting;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    
    // Update errors based on validation
    switch (name) {
      case 'email':
        setErrors(prev => ({ ...prev, email: !validateEmail(value) }));
        break;
      case 'name':
        setErrors(prev => ({ ...prev, name: !validateName(value) }));
        break;
      case 'postalCode':
        setErrors(prev => ({ ...prev, postalCode: !validatePostalCode(value) }));
        break;
      case 'cardNumber':
        setErrors(prev => ({ ...prev, cardNumber: !validateCardNumber(value) }));
        break;
    }
  };

  // Format card number as user types
  const handleCardNumberChange = (e) => {
    let { value } = e.target;
    // Remove any non-digit characters
    value = value.replace(/\D/g, '');
    // Add space after every 4 digits
    value = value.replace(/(\d{4})(?=\d)/g, '$1 ');
    // Limit the length to 19 characters (16 digits + 3 spaces)
    value = value.substring(0, 19);
    setForm({ ...form, cardNumber: value });
    setErrors(prev => ({ ...prev, cardNumber: !validateCardNumber(value.replace(/\s/g, '')) }));
  };

  const createCheckout = async () => {
    if (isSubmitting || !isFormValid()) return;

    try {
      setIsSubmitting(true);
      
      const response = await fetch('/api/checkout/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: form.email,
          name: form.name,
          postalCode: form.postalCode,
          subscriptionPlan: form.subscriptionPlan
        })
      });

      if (!response.ok) {
        throw new Error('Checkout creation failed');
      }

      const data = await response.json();
      
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      alert('Error creating checkout. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: "600px", margin: "auto", padding: "20px", background: "#fff", boxShadow: "0px 0px 10px rgba(0,0,0,0.1)", borderRadius: "10px" }}>
      <h2 style={{ fontSize: "20px", fontWeight: "bold", color: "#1a1a1a" }}>Payment Information</h2>
      <div style={{ marginTop: "20px" }}>
        <h3 style={{ fontSize: "16px", fontWeight: "bold", color: "#1a1a1a", marginBottom: "15px" }}>Choose Your Plan</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "25px" }}>
          {subscriptionPlans.map((plan) => (
            <label
              key={plan.id}
              htmlFor={`plan-${plan.id}`}
              style={{
                padding: "15px",
                border: `2px solid ${form.subscriptionPlan === plan.id ? '#007bff' : '#e0e0e0'}`,
                borderRadius: "8px",
                cursor: "pointer",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                backgroundColor: form.subscriptionPlan === plan.id ? '#f8f9ff' : '#ffffff',
                transition: 'all 0.2s ease',
                ':hover': {
                  borderColor: '#007bff',
                  backgroundColor: '#f8f9ff'
                }
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1 }}>
                <input
                  type="radio"
                  id={`plan-${plan.id}`}
                  name="subscriptionPlan"
                  value={plan.id}
                  checked={form.subscriptionPlan === plan.id}
                  onChange={(e) => setForm({ ...form, subscriptionPlan: e.target.value })}
                  style={{ 
                    width: "20px", 
                    height: "20px",
                    accentColor: "#007bff"
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: "600", color: "#333" }}>{plan.label}</div>
                  <div style={{ fontSize: "14px", color: "#666", marginTop: "2px" }}>{plan.price}</div>
                  <div style={{ fontSize: "13px", color: "#666", marginTop: "4px" }}>{plan.description}</div>
                </div>
              </div>
              {plan.savings && (
                <div style={{ 
                  backgroundColor: "#e8f4ff",
                  color: "#007bff",
                  padding: "4px 8px",
                  borderRadius: "4px",
                  fontSize: "12px",
                  fontWeight: "600",
                  whiteSpace: "nowrap",
                  marginLeft: "10px"
                }}>
                  Save {plan.savings}
                </div>
              )}
            </label>
          ))}
        </div>
        <h3 style={{ fontSize: "16px", fontWeight: "bold", color: "#1a1a1a" }}>Billing Information</h3>
        <div style={{ position: "relative" }}>
          <input 
            type="text" 
            name="name" 
            placeholder="Cardholder's Name*" 
            value={form.name} 
            onChange={handleChange}
            style={{ 
              width: "100%", 
              padding: "10px", 
              marginTop: "10px", 
              border: `1px solid ${errors.name ? '#dc3545' : '#ccc'}`,
              borderRadius: "5px",
              color: "#333333",
              backgroundColor: "#ffffff !important"
            }} 
          />
          {errors.name && <span style={{ color: '#dc3545', fontSize: '12px', position: 'absolute', bottom: '-18px', left: '0' }}>Name is required</span>}
        </div>
        <div style={{ position: "relative", marginTop: "20px" }}>
          <input 
            type="email" 
            name="email" 
            placeholder="Email*" 
            value={form.email} 
            onChange={handleChange}
            style={{ 
              width: "100%", 
              padding: "10px", 
              border: `1px solid ${errors.email ? '#dc3545' : '#ccc'}`,
              borderRadius: "5px",
              color: "#333333",
              backgroundColor: "#ffffff !important"
            }} 
          />
          {errors.email && <span style={{ color: '#dc3545', fontSize: '12px', position: 'absolute', bottom: '-18px', left: '0' }}>Please enter a valid email</span>}
        </div>
        <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
          <select 
            name="country" 
            value={form.country} 
            onChange={handleChange} 
            style={{ 
              width: "50%", 
              padding: "10px", 
              border: "1px solid #ccc", 
              borderRadius: "5px",
              backgroundColor: "#fff",
              color: "#333333"
            }}
          >
            {countries.map((country) => (
              <option key={country.code} value={country.code}>
                {country.name}
              </option>
            ))}
          </select>
          <div style={{ position: "relative", width: "50%" }}>
            <input 
              type="text" 
              name="postalCode" 
              placeholder="Postal Code*" 
              value={form.postalCode} 
              onChange={handleChange}
              style={{ 
                width: "100%", 
                padding: "10px", 
                border: `1px solid ${errors.postalCode ? '#dc3545' : '#ccc'}`,
                borderRadius: "5px",
                color: "#333333",
                backgroundColor: "#ffffff !important"
              }} 
            />
            {errors.postalCode && <span style={{ color: '#dc3545', fontSize: '12px', position: 'absolute', bottom: '-18px', left: '0' }}>Numbers only</span>}
          </div>
        </div>
        <div style={{ marginTop: "20px", position: "relative" }}>
          <input 
            type="text" 
            name="cardNumber" 
            placeholder="•••• •••• •••• ••••" 
            value={form.cardNumber} 
            onChange={handleCardNumberChange}
            maxLength="19"
            style={{ 
              width: "100%", 
              padding: "10px", 
              border: `1px solid ${errors.cardNumber ? '#dc3545' : '#ccc'}`,
              borderRadius: "5px",
              color: "#333333",
              backgroundColor: "#ffffff !important"
            }} 
          />
          {errors.cardNumber && <span style={{ color: '#dc3545', fontSize: '12px', position: 'absolute', bottom: '-18px', left: '0' }}>Please enter a valid card number</span>}
          <div style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", display: "flex", gap: "8px", alignItems: "center" }}>
            <Image src="/visa.svg" alt="Visa" width={38} height={24} style={{ objectFit: "contain" }} />
            <Image src="/mastercard.svg" alt="MasterCard" width={42} height={26} style={{ objectFit: "contain" }} />
            <Image src="/amex.svg" alt="Amex" width={38} height={24} style={{ objectFit: "contain" }} />
          </div>
        </div>
        <button 
          onClick={createCheckout} 
          disabled={!isFormValid()}
          style={{ 
            width: "100%", 
            padding: "10px", 
            marginTop: "30px", 
            background: isFormValid() ? "#007bff" : "#cccccc",
            color: "white", 
            borderRadius: "5px", 
            border: "none",
            opacity: 1,
            cursor: !isFormValid() ? 'not-allowed' : 'pointer',
            transition: "background-color 0.3s ease"
          }}
        >
          {isSubmitting ? 'Processing...' : 'Checkout'}
        </button>
      </div>
      <p style={{ fontSize: "12px", color: "gray", marginTop: "10px" }}>
        By submitting this order, I {form.subscriptionPlan !== 'one-time' ? 'confirm that I am signing up for a subscription product and' : ''} agree to the
        <a href="#" style={{ color: "#007bff", textDecoration: "underline" }}> Terms of Service </a>
        and accept the <a href="#" style={{ color: "#007bff", textDecoration: "underline" }}> Privacy Policy</a>.
      </p>
    </div>
  );
}
