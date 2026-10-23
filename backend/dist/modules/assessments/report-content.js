"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.describeScore = describeScore;
exports.buildStrength = buildStrength;
exports.buildGrowthArea = buildGrowthArea;
exports.buildSteadyArea = buildSteadyArea;
exports.dimensionFromScore = dimensionFromScore;
exports.steadyAreasFromScores = steadyAreasFromScores;
exports.withInterpretation = withInterpretation;
exports.buildPracticePlan = buildPracticePlan;
exports.buildPracticeRecommendations = buildPracticeRecommendations;
const guidance_library_1 = require("./guidance-library");
function contentFor(d) {
    return (0, guidance_library_1.topicContentFor)(d.factorCode, d.factorName, d.direction);
}
function measures(d) {
    return (d.factorDescription?.trim() ||
        contentFor(d)?.measures ||
        (d.direction === "HIGHER_IS_CONCERN"
            ? `How often the behaviours described under ${d.factorName} happen. A lower score is the positive result.`
            : `How often the behaviours described under ${d.factorName} happen. A higher score is the positive result.`));
}
function quote(text) {
    return `"${text.trim().replace(/[.?!:;,\s]+$/, "")}"`;
}
/** One sentence tying the interpretation to the parent's own answers, or saying it is broad. */
function evidenceSentence(evidence, signal) {
    const picked = (evidence || []).filter((e) => e.signal === signal);
    if (picked.length === 0)
        return "";
    const parts = picked.map((e) => `${quote(e.answerLabel)} to ${quote(e.prompt)}`);
    return signal === "supports"
        ? ` This is reflected in your answers: you answered ${parts.join(", and ")}.`
        : ` For example, you answered ${parts.join(", and ")}.`;
}
const BROAD = " Your answers point to this at a general level rather than to one particular situation.";
/** One-sentence reading of a score, shown in the Growth Dimension Breakdown. */
function describeScore(d) {
    const range = `the "${d.band}" range`;
    if (d.direction === "HIGHER_IS_CONCERN") {
        return `You scored ${d.percentage}%. On this dimension a lower score is the positive result, so this falls in ${range}.`;
    }
    return `You scored ${d.percentage}%. On this dimension a higher score is the positive result, so this falls in ${range}.`;
}
function buildStrength(d, g) {
    const c = contentFor(d);
    const concern = d.direction === "HIGHER_IS_CONCERN";
    const pattern = g?.strengthExplanation ||
        c?.doingWell ||
        (concern
            ? `Your answers show that the behaviours described under ${d.factorName} rarely come up in your everyday parenting.`
            : `Your answers show that the behaviours described under ${d.factorName} happen often in your everyday parenting.`);
    const ev = evidenceSentence(d.evidence, "supports");
    return {
        factorCode: d.factorCode,
        factorName: d.factorName,
        percentage: d.percentage,
        band: d.band,
        direction: d.direction,
        title: g?.strengthTitle || `${d.factorName}: what you are doing well`,
        whatItMeasures: measures(d),
        description: pattern,
        indicates: `${pattern}${ev || BROAD}`,
        whyItMatters: g?.strengthWhy,
        actionableHabit: g?.strengthHabit || c?.maintain || "Notice the moments when this comes naturally, so the habit stays intentional when life gets busy.",
        evidence: d.evidence,
    };
}
function growthActions(d, g) {
    if (g?.growthActions && g.growthActions.length > 0)
        return g.growthActions.slice(0, 3);
    const c = contentFor(d);
    if (c)
        return c.growthActions.slice(0, 3);
    return d.direction === "HIGHER_IS_CONCERN"
        ? [
            g?.growthHabit ||
                "Notice when this pattern tends to appear (for example when you are tired or rushed) and pause for a breath before responding.",
            "When you need to correct your child, describe the behaviour and what you would like instead, rather than commenting on who your child is.",
            "Afterwards, repair: briefly acknowledge what happened and reconnect with your child.",
        ]
        : [
            g?.growthHabit || "Choose one ordinary moment each day (a meal, the drive to school, bedtime) to practise this on purpose.",
            "Notice one time this week when it went well, and what helped it go well.",
            "Start small: aim for one more instance a day rather than a big change all at once.",
        ];
}
function buildGrowthArea(d, g) {
    const c = contentFor(d);
    const concern = d.direction === "HIGHER_IS_CONCERN";
    const actions = growthActions(d, g);
    const pattern = g?.growthExplanation ||
        c?.growthPattern ||
        (concern
            ? `Your answers suggest that the behaviours described under ${d.factorName} happen fairly often right now. This is common, especially under stress, and it can change with practice.`
            : `Your answers suggest that the behaviours described under ${d.factorName} happen less often right now than they could. This is something to build gradually.`);
    const ev = evidenceSentence(d.evidence, "practice");
    return {
        factorCode: d.factorCode,
        factorName: d.factorName,
        percentage: d.percentage,
        band: d.band,
        direction: d.direction,
        title: g?.growthTitle || `${d.factorName}: what you can work on next`,
        whatItMeasures: measures(d),
        description: pattern,
        indicates: `${pattern}${ev || BROAD} This is a reflection to learn from, not a diagnosis or a judgement of you as a parent.`,
        behaviorFocus: g?.growthBehavior ||
            c?.growthBehavior ||
            `The everyday behaviours described under ${d.factorName}.`,
        actions,
        actionableHabit: actions[0],
        example: g?.growthExample ||
            c?.growthExample ||
            (concern
                ? "For example, when you feel frustrated about something your child has done, take a breath, say calmly what you noticed and what you need, and invite your child to help solve it."
                : "For example, the next time a routine moment calls for this, such as getting ready in the morning or talking about the school day, slow down and try one of the actions above."),
        smallGoal: g?.growthGoal ||
            c?.growthGoal ||
            `Practise one of the actions above on at least four days this week.`,
        evidence: d.evidence,
    };
}
function buildSteadyArea(d, g) {
    const c = contentFor(d);
    const meaning = g?.steadyExplanation ||
        c?.steadyMeaning ||
        `Your result on ${d.factorName} is a developing pattern: neither a clear strength nor a priority area right now.`;
    const ev = evidenceSentence(d.evidence, "supports") + evidenceSentence(d.evidence, "practice");
    return {
        factorCode: d.factorCode,
        factorName: d.factorName,
        percentage: d.percentage,
        band: d.band,
        direction: d.direction,
        title: `${d.factorName}: developing`,
        whatItMeasures: measures(d),
        description: meaning,
        indicates: `${meaning}${ev || BROAD}`,
        actionableHabit: g?.steadyTip ||
            c?.steadyTip ||
            g?.strengthHabit ||
            "Keep practising what already works, and notice which situations make this easier or harder for you.",
        evidence: d.evidence,
    };
}
/** Turns a stored factor score back into the inputs the builders need. */
function dimensionFromScore(s) {
    if (!s.classification)
        return null; // legacy result: no verified classification
    return {
        factorCode: s.factorCode,
        factorName: s.factorName,
        factorDescription: s.dimensionDescription ?? null,
        direction: s.direction ?? "HIGHER_IS_POSITIVE",
        percentage: s.percentage,
        interpretedPercentage: s.interpretedPercentage ?? s.percentage,
        band: s.band,
        classification: s.classification,
        evidence: s.evidence,
    };
}
/**
 * Rebuilds the "developing" (neither strength nor growth) entries from stored factor
 * scores. Only results that carry a classification take part; legacy results return [].
 */
function steadyAreasFromScores(scores, guidanceTemplates) {
    return Object.values(scores || {})
        .filter((s) => s.classification === "STEADY")
        .map((s) => buildSteadyArea(dimensionFromScore(s), guidanceTemplates?.[s.factorCode]));
}
/** Attaches the direction-aware reading to a factor score. */
function withInterpretation(score, d) {
    return {
        ...score,
        direction: d.direction,
        interpretedPercentage: d.interpretedPercentage,
        classification: d.classification,
        dimensionDescription: d.factorDescription,
        interpretation: describeScore(d),
        evidence: d.evidence,
    };
}
// ---------------------------------------------------------------------------
// Personalized recommendations and the seven-day practice plan
// ---------------------------------------------------------------------------
const byNeed = (a, b) => a.interpretedPercentage - b.interpretedPercentage;
function practiceFor(d, g) {
    const c = contentFor(d);
    const actions = growthActions(d, g);
    const maintain = g?.strengthHabit || c?.maintain || buildStrength(d, g).actionableHabit;
    if (c && !g?.growthActions) {
        return { d, ...c.plan, maintain };
    }
    return {
        d,
        notice: `Notice today the everyday moments that relate to ${d.factorName}. Simply observe how they usually go, without judging yourself.`,
        noticeExample: "Jot down one moment at the end of the day: what happened, and how you responded.",
        smallChange: actions[0],
        smallChangeExample: g?.growthExample || "Choose one routine, such as breakfast or bedtime, to try it in.",
        realLife: actions[1] || actions[0],
        realLifeExample: "Try it during a routine that usually feels rushed, such as getting ready for school.",
        respond: `Think of a moment this week related to ${d.factorName} that did not go the way you wanted. Decide what you would do differently, and try it when a similar moment comes up.`,
        respondExample: "Plan one short sentence you can say next time, so it is ready when you need it.",
        reflection: `What helped most with ${d.factorName} this week?`,
        maintain,
    };
}
/**
 * Deterministic seven-day plan built from the classified dimensions: the most pressing
 * growth area leads, a second area (growth or developing) supports it, and a strength
 * is used as an anchor on day 3. With no growth or developing areas, the plan focuses on
 * keeping the strengths going.
 */
function buildPracticePlan(dims, guidance) {
    if (dims.length === 0)
        return [];
    const growth = dims.filter((d) => d.classification === "GROWTH_OPPORTUNITY").sort(byNeed);
    const steady = dims.filter((d) => d.classification === "STEADY").sort(byNeed);
    const strengths = dims.filter((d) => d.classification === "STRENGTH").sort((a, b) => -byNeed(a, b));
    const focusOrder = [...growth, ...steady];
    const primaryDim = focusOrder[0] || [...strengths].sort(byNeed)[0];
    const secondaryDim = focusOrder.find((d) => d !== primaryDim) || primaryDim;
    const strengthDim = strengths.find((d) => d !== primaryDim) || null;
    const P = practiceFor(primaryDim, guidance?.[primaryDim.factorCode]);
    const S = practiceFor(secondaryDim, guidance?.[secondaryDim.factorCode]);
    const T = strengthDim ? practiceFor(strengthDim, guidance?.[strengthDim.factorCode]) : null;
    const tag = (...ps) => {
        const unique = ps.filter((p, i) => ps.findIndex((q) => q.d.factorCode === p.d.factorCode) === i);
        return { factorCodes: unique.map((p) => p.d.factorCode), factorNames: unique.map((p) => p.d.factorName) };
    };
    const all = [P, S, ...(T ? [T] : [])];
    return [
        {
            day: 1,
            title: "Notice Your Current Pattern",
            ...tag(P),
            objective: `Become aware of how ${P.d.factorName} shows up in your day, without changing anything yet.`,
            exercise: P.notice,
            minutes: 5,
            example: P.noticeExample,
            reflection: "When did this pattern show up today, and what was happening at the time?",
        },
        {
            day: 2,
            title: "Practise One Small Change",
            ...tag(P),
            objective: `Try one small, specific change linked to ${P.d.factorName}.`,
            exercise: P.smallChange,
            minutes: 10,
            example: P.smallChangeExample,
            reflection: "How did your child respond to the change, and how did it feel for you?",
        },
        T
            ? {
                day: 3,
                title: "Build on a Strength",
                ...tag(T, P),
                objective: `Use something you already do well (${T.d.factorName}) to support ${P.d.factorName}.`,
                exercise: `${T.maintain} Then notice whether that moment of connection makes ${P.d.factorName} a little easier today.`,
                minutes: 10,
                example: P.smallChangeExample,
                reflection: `How did your strength in ${T.d.factorName} help today?`,
            }
            : {
                day: 3,
                title: "Try a Second Small Change",
                ...tag(S),
                objective: `Try one small change linked to ${S.d.factorName}.`,
                exercise: S.smallChange,
                minutes: 10,
                example: S.smallChangeExample,
                reflection: "What was easier or harder than you expected?",
            },
        {
            day: 4,
            title: "Practise During a Real-Life Situation",
            ...tag(P),
            objective: `Apply what you are practising for ${P.d.factorName} during an ordinary routine.`,
            exercise: P.realLife,
            minutes: 10,
            example: P.realLifeExample,
            reflection: "Which part of the routine made it easier or harder to practise?",
        },
        {
            day: 5,
            title: "Respond More Intentionally",
            ...tag(S),
            objective: `Reflect on one interaction and plan a different response for ${S.d.factorName}.`,
            exercise: S.respond,
            minutes: 10,
            example: S.respondExample,
            reflection: "What would you like to say or do the next time a similar moment happens?",
        },
        {
            day: 6,
            title: "Repeat What Helped",
            ...tag(P, S),
            objective: "Strengthen the practice that felt most manageable this week.",
            exercise: "Look back at days 2 to 5. Choose the one practice that felt most manageable and repeat it today, in the same routine if you can. Note what made it work.",
            minutes: 10,
            example: `For example, if ${P.d.factorName} felt easier at bedtime, repeat the same practice at bedtime today.`,
            reflection: "What made this practice manageable for you?",
        },
        {
            day: 7,
            title: "Reflect and Prepare to Reassess",
            ...tag(...all),
            objective: "Review the week and decide what you want to keep doing.",
            exercise: "Spend ten quiet minutes looking back over the week. Write down one practice you want to keep, and one situation you would still like help with. When you are ready, retake the assessment to compare your answers.",
            minutes: 10,
            example: `"${P.reflection}"`,
            reflection: "Which practice do you want to keep using after this week?",
        },
    ];
}
function finding(d) {
    return `${d.factorName}: ${d.percentage}%, ${d.band}`;
}
/** Deterministic recommendations: growth areas first (most pressing first), then developing, then strengths to maintain. */
function buildPracticeRecommendations(dims, guidance, plan) {
    const daysFor = (code) => plan.filter((p) => p.factorCodes.includes(code)).map((p) => p.day);
    const growth = dims.filter((d) => d.classification === "GROWTH_OPPORTUNITY").sort(byNeed);
    const steady = dims.filter((d) => d.classification === "STEADY").sort(byNeed);
    const strengths = dims.filter((d) => d.classification === "STRENGTH");
    const forGrowth = (d, kind) => {
        const g = guidance?.[d.factorCode];
        const c = contentFor(d);
        const actions = growthActions(d, g);
        const r = c && !g?.growthActions
            ? c.recommendation
            : {
                title: `Practise ${d.factorName} in one daily routine`,
                what: actions[0],
                when: "During one everyday routine, such as getting ready in the morning, homework or bedtime.",
                how: actions[1] || actions[0],
                example: g?.growthExample || buildGrowthArea(d, g).example || "",
                objective: d.direction === "HIGHER_IS_CONCERN"
                    ? `Make the behaviours described under ${d.factorName} less frequent in everyday life.`
                    : `Make the behaviours described under ${d.factorName} a more regular part of everyday life.`,
            };
        return {
            factorCode: d.factorCode,
            factorName: d.factorName,
            kind,
            finding: finding(d),
            ...r,
            when: kind === "steady" ? `${r.when} Start once a day; this is already partly in place.` : r.when,
            planDays: daysFor(d.factorCode),
        };
    };
    return [
        ...growth.map((d) => forGrowth(d, "growth")),
        ...steady.map((d) => forGrowth(d, "steady")),
        ...strengths.map((d) => {
            const s = buildStrength(d, guidance?.[d.factorCode]);
            return {
                factorCode: d.factorCode,
                factorName: d.factorName,
                kind: "strength",
                finding: finding(d),
                title: `Keep ${d.factorName} going`,
                what: s.actionableHabit,
                when: "In the everyday moments where this already comes naturally to you.",
                how: "Keep doing it on purpose, especially on busy or stressful days when habits slip most easily.",
                example: practiceFor(d, guidance?.[d.factorCode]).smallChangeExample,
                objective: "Protect a pattern that is already working for you and your child.",
                planDays: daysFor(d.factorCode),
            };
        }),
    ];
}
