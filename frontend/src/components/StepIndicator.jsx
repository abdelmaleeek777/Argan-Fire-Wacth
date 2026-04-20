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
    <div className="w-full max-w-3xl mx-auto mb-16 px-4 relative z-20">
      <div className="flex items-center justify-between relative">
        {/* Background Line */}
        <div className="absolute top-5 left-0 w-full h-0.5 bg-[#4F5C4A]/10 z-0"></div>

        {/* Progress Line */}
        <div
          className="absolute top-5 left-0 h-0.5 bg-[#4E6B4A] transition-all duration-700 ease-in-out z-0"
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
              className="relative z-10 flex flex-col items-center"
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500 shadow-sm ${
                  isCompleted
                    ? "bg-[#4E6B4A] border-[#4E6B4A] text-white shadow-[#4E6B4A]/20"
                    : isActive
                      ? "bg-white border-[#4E6B4A] text-[#4E6B4A] scale-110 ring-8 ring-[#4E6B4A]/5 shadow-lg shadow-[#4E6B4A]/10"
                      : "bg-[#F8F7F2] border-[#4F5C4A]/20 text-[#6B7468]"
                }`}
              >
                {isCompleted ? (
                  <Check size={18} strokeWidth={3} />
                ) : (
                  <span className="font-[800] text-[13px]">{stepNumber}</span>
                )}
              </div>
              <span
                className={`absolute top-14 whitespace-nowrap text-[10px] font-bold uppercase tracking-[0.2em] transition-all duration-500 ${
                  isActive
                    ? "text-[#4E6B4A] translate-y-0 opacity-100"
                    : isCompleted
                      ? "text-[#4E6B4A]/70 translate-y-0 opacity-80"
                      : "text-[#6B7468]/60 translate-y-1 opacity-50"
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
