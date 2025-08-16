"use client";

import React, { useState } from 'react';
import { X, Shield, Mail, Zap } from 'lucide-react';

interface UserInfo {
  name: string;
  email: string;
}

interface UserInfoDialogProps {
  isOpen: boolean;
  onSubmit: (userInfo: UserInfo) => void;
  onClose?: () => void;
}

export function UserInfoDialog({ isOpen, onSubmit, onClose }: UserInfoDialogProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: { name?: string; email?: string } = {};
    
    if (!name.trim()) {
      newErrors.name = 'USER_ID REQUIRED';
    }
    
    if (!email.trim()) {
      newErrors.email = 'NEURAL_LINK_ADDRESS REQUIRED';
    } else if (!validateEmail(email)) {
      newErrors.email = 'INVALID NEURAL_LINK_FORMAT';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    onSubmit({ name: name.trim(), email: email.trim() });
    setErrors({});
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      {/* Dialog */}
      <div className="relative poster-card energy-border rounded-3xl w-full max-w-md mx-4 p-8">
        {/* Close button */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 accent-btn--quiet w-8 h-8 rounded-lg flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="w-full h-full bg-gradient-to-br from-cyan-400 to-blue-600 rounded-xl flex items-center justify-center border border-white/20">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <div className="absolute inset-0 border-2 border-cyan-400 rounded-xl animate-ping opacity-30" />
          </div>
          <h2 className="text-3xl font-bold headline mb-3">
            NEURAL LINK SETUP
          </h2>
          <div className="text-cyan-400 font-mono text-sm mb-2">
            &gt; AUTHENTICATION PROTOCOL v2.1
          </div>
          <p className="text-gray-300 font-mono text-sm">
            Initialize user credentials for secure AI communication
          </p>
        </div>
        
        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name field */}
          <div>
            <label htmlFor="name" className="block text-sm font-mono text-cyan-400 mb-2">
              [USER_IDENTIFICATION] *
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 bg-cyan-400 rounded-sm flex items-center justify-center">
                <Shield className="w-3 h-3 text-black" />
              </div>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`w-full pl-12 pr-4 py-3 bg-slate-800/50 border-2 rounded-xl font-mono text-white placeholder:text-gray-500 backdrop-blur-sm transition-all duration-300 ${
                  errors.name 
                    ? 'border-red-500/50 bg-red-900/20' 
                    : 'border-cyan-500/30 focus:border-cyan-400'
                } focus:outline-none focus:ring-2 focus:ring-cyan-400/30`}
                placeholder="Enter user identification..."
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              </div>
            </div>
            {errors.name && (
              <p className="mt-2 text-sm text-red-400 font-mono">[ERROR] {errors.name}</p>
            )}
          </div>
          
          {/* Email field */}
          <div>
            <label htmlFor="email" className="block text-sm font-mono text-cyan-400 mb-2">
              [NEURAL_LINK_ADDRESS] *
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 bg-purple-400 rounded-sm flex items-center justify-center">
                <Mail className="w-3 h-3 text-black" />
              </div>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full pl-12 pr-4 py-3 bg-slate-800/50 border-2 rounded-xl font-mono text-white placeholder:text-gray-500 backdrop-blur-sm transition-all duration-300 ${
                  errors.email 
                    ? 'border-red-500/50 bg-red-900/20' 
                    : 'border-purple-500/30 focus:border-purple-400'
                } focus:outline-none focus:ring-2 focus:ring-purple-400/30`}
                placeholder="user@neural.link"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              </div>
            </div>
            {errors.email && (
              <p className="mt-2 text-sm text-red-400 font-mono">[ERROR] {errors.email}</p>
            )}
          </div>
          
          {/* Submit button */}
          <button
            type="submit"
            className="w-full accent-btn py-4 px-6 rounded-xl font-mono text-lg font-bold uppercase tracking-wider relative overflow-hidden group"
          >
            <span className="relative z-10 flex items-center justify-center space-x-3">
              <Zap className="w-5 h-5" />
              <span>Initialize Neural Link</span>
              <Zap className="w-5 h-5" />
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 to-purple-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </button>
        </form>
        
        {/* Security status */}
        <div className="mt-6 p-4 bg-slate-900/50 rounded-xl border border-green-500/20">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
            <p className="text-xs text-green-400 font-mono">
              [SECURE_CONNECTION] Data encrypted with quantum protocols
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}