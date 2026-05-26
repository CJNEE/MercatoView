import React, { useState } from 'react';
import { api } from '../services/api';
import { X, Send } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  price: string;
}

interface MessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  stallId: number;
  stallName: string;
  product?: Product | null;
}

export const MessageModal: React.FC<MessageModalProps> = ({
  isOpen,
  onClose,
  stallId,
  stallName,
  product
}) => {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    setError('');
    
    try {
      await api.post('messages/', {
        stall: stallId,
        product: product ? product.id : null,
        content: content
      });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setContent('');
        onClose();
      }, 2000);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="bg-[#121212] border border-white/10 rounded-2xl w-full max-w-md p-6 relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <X size={20} />
        </button>
        
        <h2 className="text-xl font-bold text-white mb-1">Message {stallName}</h2>
        
        {product ? (
          <p className="text-sm text-gray-400 mb-4">
            Inquiring about: <strong className="text-food-orange">{product.name}</strong> (₱{product.price})
          </p>
        ) : (
          <p className="text-sm text-gray-400 mb-4">General inquiry</p>
        )}

        {success ? (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl text-center">
            Message sent successfully! The seller will contact you shortly.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={product ? `I'd like to order ${product.name}...` : "Type your message here..."}
                className="w-full bg-[#1A1A1A] border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-food-orange min-h-[100px]"
                required
              />
            </div>
            {error && <p className="text-xs text-red-400">{error}</p>}
            
            <button
              type="submit"
              disabled={isSubmitting || !content.trim()}
              className="w-full btn-primary py-3 font-semibold flex items-center justify-center gap-2"
            >
              <Send size={16} />
              {isSubmitting ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
