import React from "react";
import { Check } from "lucide-react";

/**
 * StepIndicator component for the registration flow.
 * @param {number} currentStep - 1-indexed current step.
 * @param {number} totalSteps - Topal steps in the flow.
 * @param {string[]} stepNames - Array of step labels.
 */
const StepIndicator = ({ currentStep, totalSteps = 4, stepNames = [] }) => {
  return (
    <div className="w-full max-w-4xl mx-auto mb-12 px-4 relative z-20">
      <div className="flex items-center justify-between relative">
        {/* Background Line */}
        <div className="absolute top-5 left-0 w-full h-0.5 bg-slate-200 z-0"></div>

        {/* Progress Line */}
        <div
          className="absolute top-5 left-0 h-0.5 bg-emerald-600 transition-all duration-500 z-0"
          style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
        ></div>

        {Array.from({ length: totalSteps }).map((_, idx) => {
          const stepNumber = idx + 1;
          const isCompleted = stepNumber < currentStep;
          const isActive = stepNumber === currentStep;
          const label = stepNames[idx] || `Step ${stepNumber}`;

          return (
            <div
              key={idx}
              className="relative z-10 flex flex-col items-center group"
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 shadow-xl ${
                  isCompleted
                    ? "bg-emerald-600 border-emerald-600 text-white"
                    : isActive
                      ? "bg-white border-emerald-600 text-emerald-600 scale-110 ring-4 ring-emerald-600/10"
                      : "bg-slate-100 border-slate-200 text-slate-400"
                }`}
              >
                {isCompleted ? (
                  <Check size={18} strokeWidth={3} />
                ) : (
                  <span className="font-bold text-sm">{stepNumber}</span>
                )}
              </div>
              <span
                className={`absolute top-12 whitespace-nowrap text-[10px] font-bold uppercase tracking-widest transition-colors duration-300 ${
                  isActive
                    ? "text-emerald-600"
                    : isCompleted
                      ? "text-emerald-700"
                      : "text-slate-400"
                }`}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StepIndicator;
