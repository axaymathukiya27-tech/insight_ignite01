import { ScoringDirection } from "@insight-ignite/shared";

/**
 * Default, plain-language report and practice wording for the four parenting dimensions
 * of the Parent Style Questionnaire. It is used ONLY when the assessment version has no
 * authored wording for that dimension (guidanceTemplates in the approved scoring config),
 * and a topic is only matched when the dimension's configured scoring direction is the
 * one the wording was written for. Anything else falls back to the generic wording.
 *
 * This text is educational and needs review by the assessment author before it is
 * treated as approved content. It never decides a score or a classification.
 */

export interface PlanText {
  notice: string;
  noticeExample: string;
  smallChange: string;
  smallChangeExample: string;
  realLife: string;
  realLifeExample: string;
  respond: string;
  respondExample: string;
  reflection: string;
}

export interface TopicContent {
  measures: string;
  doingWell: string; // Strength: the positive pattern, in everyday language
  maintain: string; // Strength: one way to keep it going
  steadyMeaning: string;
  steadyTip: string;
  growthPattern: string; // Growth: what the answers suggest
  growthBehavior: string; // Growth: the behaviour worth practising
  growthActions: string[];
  growthExample: string;
  growthGoal: string;
  recommendation: { title: string; what: string; when: string; how: string; example: string; objective: string };
  plan: PlanText;
}

type Topic = "warmth" | "structure" | "autonomy" | "control";

const TOPICS: Record<Topic, { direction: ScoringDirection; keywords: RegExp; content: TopicContent }> = {
  warmth: {
    direction: "HIGHER_IS_POSITIVE",
    keywords: /warmth|responsive/i,
    content: {
      measures:
        "How often you show affection, make time to listen, and respond to your child's feelings, especially when they are upset.",
      doingWell:
        "You often make space for your child's feelings and conversations. This helps a child feel heard, safe and supported.",
      maintain:
        "Keep one small daily ritual of connection, such as a few minutes of chat at bedtime or on the way home, even on busy days.",
      steadyMeaning:
        "Warm, responsive moments are part of your parenting, but they may come more easily on calm days than on rushed or stressful ones.",
      steadyTip:
        "On busy days, aim for one short moment of full attention, such as looking up and listening for a minute when your child starts talking.",
      growthPattern:
        "Your answers suggest that, right now, there may be fewer moments of shared warmth and listening than you would like. Busy routines and stress make this very common.",
      growthBehavior:
        "Noticing your child's feelings and giving short moments of full, unhurried attention.",
      growthActions: [
        "Set aside ten minutes a day of one-to-one time where your child chooses the activity and your phone is away.",
        "When your child is upset, name the feeling before solving the problem: \"You seem really frustrated.\"",
        "Show affection in a way your child enjoys, such as a hug, a note in the lunch box, or a shared joke.",
      ],
      growthExample:
        "Your child comes home quiet after school. Instead of asking \"How was school?\" while cooking, you sit down for a minute and say, \"You look a bit tired today. Do you want to tell me about it?\"",
      growthGoal: "Have one ten-minute, phone-free conversation with your child on at least four days this week.",
      recommendation: {
        title: "Ten minutes of undivided attention",
        what: "Spend ten minutes listening to your child without correcting, advising or checking your phone.",
        when: "At a calm time of day you can protect, such as after dinner or just before bed.",
        how: "Let your child pick the topic or activity. Listen, ask one curious question, and reflect back what you hear.",
        example: "\"So the game at break didn't go the way you hoped. What happened next?\"",
        objective: "Help your child feel heard, and make listening a regular habit rather than something that happens only when there is time.",
      },
      plan: {
        notice:
          "Notice the moments today when your child tries to get your attention or share something. Simply observe how you usually respond, without judging yourself.",
        noticeExample: "Your child starts telling you about their day while you are on your phone. Notice whether you look up.",
        smallChange: "Give your child ten minutes of undivided attention, with your phone away and your child leading.",
        smallChangeExample: "Sit with your child while they show you a drawing or a game, and ask, \"Tell me about this part.\"",
        realLife: "When your child shows a strong feeling today, name the feeling before you try to fix the situation.",
        realLifeExample: "\"You're disappointed that we can't go to the park. That makes sense.\"",
        respond: "Think about a moment this week when your child wanted your attention and didn't get it. Decide what you could say next time, and try it.",
        respondExample: "\"I want to hear this properly. Give me two minutes to finish, and then I'm all yours.\"",
        reflection: "When did your child seem most relaxed and open with you this week?",
      },
    },
  },
  structure: {
    direction: "HIGHER_IS_POSITIVE",
    keywords: /structure|boundar|consisten/i,
    content: {
      measures:
        "How consistently you set clear, calm expectations and routines, and follow through on them in a predictable way.",
      doingWell:
        "You usually set clear expectations and follow through calmly. Predictable routines and limits help children feel secure and know what to expect.",
      maintain:
        "Before introducing a new rule, explain it once, calmly and in advance, so your follow-through stays fair and predictable.",
      steadyMeaning:
        "You often set expectations, but following through may be harder in some situations, such as when you are tired or short of time.",
      steadyTip:
        "Pick one daily routine (for example, screen time or bedtime) and keep the same expectation and the same response for a week.",
      growthPattern:
        "Your answers suggest that keeping limits and routines consistent may be difficult in some everyday situations at the moment. This is common when family life is busy.",
      growthBehavior:
        "Stating one clear expectation in advance, explaining it calmly, and following through the same way each time.",
      growthActions: [
        "Choose one routine that often causes friction and agree a simple, clear expectation for it in advance.",
        "State the expectation and the consequence calmly before the situation starts, not in the middle of it.",
        "Follow through in a calm, matter-of-fact way, the same way each time, without raising your voice.",
      ],
      growthExample:
        "Instead of repeating \"Turn off the TV\" several times, you say before it starts: \"You can watch one episode, then it's time for homework.\" When the episode ends, you calmly switch it off and help your child start.",
      growthGoal: "Keep one clearly stated routine the same way for five days in a row.",
      recommendation: {
        title: "One clear, predictable routine",
        what: "Choose one everyday situation and set one clear expectation that you follow through on calmly and consistently.",
        when: "Around a routine that often causes friction, such as getting ready for school, homework or bedtime.",
        how: "Explain the expectation in advance, keep it short, and respond the same way each time without arguing or threatening.",
        example: "\"Shoes and bag by the door before breakfast. Once they're there, we can have breakfast together.\"",
        objective: "Make expectations predictable so that your child knows what will happen and fewer situations turn into conflict.",
      },
      plan: {
        notice:
          "Notice today when expectations or limits come up, for example at screen time, homework or bedtime. Observe what you usually say and do, without judging yourself.",
        noticeExample: "Notice how many times you remind your child before they start their homework.",
        smallChange: "Choose one routine and explain one clear expectation to your child in advance, calmly and briefly.",
        smallChangeExample: "\"From today, tablets go on the charger at 7:30, and then we read together.\"",
        realLife: "Follow through on today's expectation calmly, in the same way you described it, even if your child protests.",
        realLifeExample: "\"I know you want five more minutes. It's 7:30, so the tablet goes on the charger now. Let's choose a book.\"",
        respond: "Think about a moment when a limit turned into an argument. Plan a short, calm sentence you can use next time.",
        respondExample: "\"I hear you. The answer is still no, and I'm here to help you with the next step.\"",
        reflection: "Which routine felt calmer this week when the expectation was clear in advance?",
      },
    },
  },
  autonomy: {
    direction: "HIGHER_IS_POSITIVE",
    keywords: /autonom|independ/i,
    content: {
      measures:
        "How often you let your child make age-appropriate choices, try things themselves, and solve problems before you step in.",
      doingWell:
        "You often give your child room to make choices and try things for themselves. This helps children build confidence and problem-solving skills.",
      maintain:
        "As your child grows, keep handing over one new age-appropriate responsibility, and let them learn from small mistakes.",
      steadyMeaning:
        "You sometimes encourage independence, but you may step in quickly in some situations, for example when time is short.",
      steadyTip:
        "Before helping, pause and ask, \"What do you think you could try first?\"",
      growthPattern:
        "Your answers suggest that you may often step in, decide or solve problems for your child at the moment. Many caring parents do this to keep things moving or to protect their child.",
      growthBehavior:
        "Offering simple choices and giving your child time to try before helping.",
      growthActions: [
        "Offer two acceptable choices instead of one instruction: \"Do you want to do maths or reading first?\"",
        "Wait a little longer before helping, and ask what your child could try first.",
        "Give your child one small daily responsibility that is fully theirs, such as packing their school bag.",
      ],
      growthExample:
        "Your child is stuck on a puzzle or a homework question. Instead of showing the answer, you ask, \"What have you tried so far? What else could you try?\" and wait.",
      growthGoal: "Let your child make one real choice or solve one small problem on their own each day this week.",
      recommendation: {
        title: "Choices and a chance to try first",
        what: "Offer your child small, age-appropriate choices and give them time to try before you step in.",
        when: "During routines where you usually decide or do things for your child, such as getting dressed, packing a bag or homework.",
        how: "Give two acceptable options, then wait. If your child is stuck, ask a question rather than giving the answer.",
        example: "\"It's cold today. Would you like the blue jumper or the red one?\"",
        objective: "Help your child build confidence and the skills to manage small tasks and decisions independently.",
      },
      plan: {
        notice:
          "Notice today how often you decide or do things for your child that they could try themselves. Simply observe, without judging yourself.",
        noticeExample: "Notice whether you pack your child's school bag or zip their coat because it is quicker.",
        smallChange: "Offer your child two acceptable choices at least twice today.",
        smallChangeExample: "\"Would you like to have your bath before or after your story?\"",
        realLife: "Give your child one task to do on their own today, and wait before helping, even if it takes longer.",
        realLifeExample: "Let your child pour their own cereal or pack their own bag, and say, \"Have a go, I'm here if you need me.\"",
        respond: "Think of a moment when you stepped in quickly. Plan a question you could ask instead next time.",
        respondExample: "\"What do you think the first step is?\"",
        reflection: "What did your child manage on their own this week that surprised you?",
      },
    },
  },
  control: {
    direction: "HIGHER_IS_CONCERN",
    keywords: /control|critic/i,
    content: {
      measures:
        "How often criticism, guilt, shaming, comparisons or threats are used to correct or influence your child's behaviour. On this dimension, a lower score is the positive result.",
      doingWell:
        "Your answers indicate that criticism, guilt and comparisons rarely come up when you correct your child. Children who are corrected without shame tend to feel safer admitting mistakes.",
      maintain:
        "When you correct your child, keep describing the behaviour rather than the child, and keep comparisons with other children out of it.",
      steadyMeaning:
        "Criticism, guilt or comparisons come up sometimes, perhaps more often when you are tired, stressed or in a hurry.",
      steadyTip:
        "Notice the situations when criticism tends to slip out, and pause for one breath before responding in those moments.",
      growthPattern:
        "Your answers suggest that criticism, guilt, comparisons or threats may come up fairly often when you correct your child right now. Many parents fall into these patterns under stress, and they can change with practice.",
      growthBehavior:
        "Correcting behaviour without shame, comparisons or threats, and allowing respectful disagreement.",
      growthActions: [
        "Describe the behaviour, not your child: \"The toys are still on the floor\" instead of \"You're so lazy.\"",
        "Leave comparisons with siblings or other children out of corrections.",
        "Set limits calmly, with a consequence explained in advance, instead of threats said in the heat of the moment.",
      ],
      growthExample:
        "Instead of \"Why can't you be like your sister? You never finish your homework,\" try \"Your homework isn't finished yet. Let's decide together when you'll do it.\"",
      growthGoal: "Catch one critical or comparing comment this week before you say it, and replace it with a description of the behaviour.",
      recommendation: {
        title: "Correct the behaviour, not the child",
        what: "When something goes wrong, describe what happened and what you would like instead, without labels, guilt, comparisons or threats.",
        when: "In the moments you usually feel most frustrated, such as homework, getting out of the door, or arguments between siblings.",
        how: "Pause for a breath, describe the behaviour in one sentence, say what you need, and invite your child to help solve it. Allow them to disagree respectfully.",
        example: "\"You shouted at your brother. I need everyone to speak kindly. What could you say to him instead?\"",
        objective: "Keep limits clear while protecting your child's sense of worth, so mistakes can be discussed openly.",
      },
      plan: {
        notice:
          "Notice today when you feel frustrated with your child and what you say in those moments. Simply observe, without judging yourself.",
        noticeExample: "Notice whether phrases such as \"always\", \"never\" or \"why can't you\" come up.",
        smallChange: "When you need to correct your child today, describe the behaviour instead of commenting on who your child is.",
        smallChangeExample: "\"The milk spilled. Let's get a cloth\" instead of \"You're so clumsy.\"",
        realLife: "Set one limit today calmly, with the consequence explained in advance, and without a threat.",
        realLifeExample: "\"If the game isn't packed away by dinner, it stays on the shelf tomorrow.\"",
        respond: "Think of a moment this week when a comment came out more harshly than you wanted. Plan what you could say instead, and, if helpful, repair with your child.",
        respondExample: "\"Earlier I said you never listen. That wasn't fair. I was frustrated about the shoes.\"",
        reflection: "How did your child respond when you described the behaviour rather than criticising?",
      },
    },
  },
};

export function topicContentFor(
  code: string,
  name: string,
  direction: ScoringDirection
): TopicContent | undefined {
  for (const topic of Object.values(TOPICS)) {
    if (topic.direction === direction && (topic.keywords.test(name) || topic.keywords.test(code))) {
      return topic.content;
    }
  }
  return undefined;
}
