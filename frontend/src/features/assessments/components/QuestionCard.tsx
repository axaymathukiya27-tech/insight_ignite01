import React from "react";
import { PublicAssessmentItem, PublicAssessmentOption } from "@insight-ignite/shared";

interface Props {
  item: PublicAssessmentItem;
  selectedOptionId?: string;
  onSelectOption: (optionId: string) => void;
  error?: string;
  /** Question number, shown when questions are listed together on one page. */
  number?: number;
}

export default function QuestionCard({
  item,
  selectedOptionId,
  onSelectOption,
  error,
  number,
}: Props) {
  const sortedOptions = [...item.options].sort(
    (a, b) => a.orderIndex - b.orderIndex
  );

  return (
    <div className="w-full space-y-5">
      {/* Question Prompt */}
      <div className="space-y-2">
        <h2
          className={`font-serif font-bold text-[#2D241E] leading-snug ${
            number ? "text-lg sm:text-xl flex gap-3" : "text-2xl sm:text-3xl"
          }`}
        >
          {number && (
            <span className="shrink-0 w-8 h-8 rounded-full bg-[#8C5E42] text-[#FDFBF7] font-sans text-sm flex items-center justify-center">
              {number}
            </span>
          )}
          <span>{item.prompt}</span>
        </h2>
        {item.contextPrompt && (
          <p className={`text-sm sm:text-base text-[#6B5A4E] leading-relaxed italic ${number ? "pl-11" : ""}`}>
            {item.contextPrompt}
          </p>
        )}
      </div>

      {/* Answer Options Radio Group */}
      <fieldset className="space-y-3" role="radiogroup" aria-label={item.prompt}>
        <legend className="sr-only">{item.prompt}</legend>

        {sortedOptions.map((opt: PublicAssessmentOption, idx) => {
          const isSelected = selectedOptionId === opt.id;
          const letter = String.fromCharCode(65 + idx); // A, B, C, D...

          return (
            <label
              key={opt.id}
              className={`flex items-start sm:items-center gap-4 ${number ? "p-3 sm:p-4" : "p-4 sm:p-5"} rounded-2xl border transition-all cursor-pointer select-none focus-within:ring-2 focus-within:ring-[#8C5E42] ${
                isSelected
                  ? "bg-[#FAF5EE] border-[#8C5E42] shadow-xs text-[#2D241E]"
                  : "bg-white border-[#E3D8CC] hover:bg-[#FDFBF7] hover:border-[#CDBDAF] text-[#4A3D34]"
              }`}
            >
              <input
                type="radio"
                name={`question_${item.id}`}
                value={opt.id}
                checked={isSelected}
                onChange={() => onSelectOption(opt.id)}
                className="sr-only"
                aria-checked={isSelected}
              />

              {/* Option Letter Badge */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                  isSelected
                    ? "bg-[#8C5E42] text-[#FDFBF7]"
                    : "bg-[#F3EDE6] text-[#7C6A5E]"
                }`}
              >
                {letter}
              </div>

              {/* Option Text */}
              <span className="text-sm sm:text-base font-medium flex-grow leading-relaxed">
                {opt.label}
              </span>

              {/* Checkmark Indicator */}
              <div
                className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                  isSelected
                    ? "border-[#8C5E42] bg-[#8C5E42] text-white"
                    : "border-[#D5C7B8] bg-transparent"
                }`}
                aria-hidden="true"
              >
                {isSelected && (
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="3"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </div>
            </label>
          );
        })}
      </fieldset>

      {/* Validation Message */}
      {error && (
        <div
          role="alert"
          className="flex items-center gap-2 text-xs font-semibold text-[#B91C1C] pt-1"
        >
          <svg
            className="w-4 h-4 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
