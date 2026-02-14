"use client";

import { useState } from "react";
import { Shield, User, ShoppingBag, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAgentStore } from "@/stores/agentStore";

export default function Navbar() {
  const [showSaved, setShowSaved] = useState(false);
  const savedItems = useAgentStore((s) => s.savedItems);

  return (
    <nav className="relative z-50 flex items-center justify-between px-6 py-4 md:px-10">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <span className="text-xl font-bold text-white tracking-tight">
          Sentinel
        </span>
      </div>

      {/* Profile / Saved */}
      <button
        onClick={() => setShowSaved(!showSaved)}
        className="relative flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 backdrop-blur-sm hover:bg-white/25 transition-colors"
      >
        <User className="w-4 h-4 text-white" />
        <span className="text-sm text-white font-medium hidden sm:inline">
          My Saves
        </span>
        {savedItems.length > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white text-orange-500 text-xs font-bold flex items-center justify-center">
            {savedItems.length}
          </span>
        )}
      </button>

      {/* Saved Items Dropdown */}
      <AnimatePresence>
        {showSaved && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="absolute top-16 right-6 md:right-10 w-80 bg-white rounded-2xl shadow-xl border border-orange-100 overflow-hidden z-50"
          >
            <div className="flex items-center justify-between p-4 border-b border-orange-100">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-orange-500" />
                <span className="font-semibold text-gray-800">Saved Deals</span>
              </div>
              <button
                onClick={() => setShowSaved(false)}
                className="p-1 hover:bg-orange-50 rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {savedItems.length === 0 ? (
                <p className="p-4 text-sm text-gray-400 text-center">
                  No saved deals yet. Start shopping!
                </p>
              ) : (
                savedItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 border-b border-orange-50 hover:bg-orange-50/50 transition-colors"
                  >
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {item.product.name}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-500">
                        {item.product.retailer}
                      </span>
                      <span className="text-sm font-bold text-orange-500">
                        ${item.product.price.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
