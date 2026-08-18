import os
import json
from dotenv import load_dotenv
from groq import Groq


# ============================================================
# 1. LOAD API KEY
# ============================================================

load_dotenv()

api_key = os.getenv("GROQ_API_KEY")

if not api_key:
    print("ERROR: GROQ_API_KEY not found.")
    print("Please add your API key to the .env file.")
    exit()

client = Groq(api_key=api_key)


# ============================================================
# 2. CANDIDATE INFORMATION
# ============================================================

candidate_info = """
Candidate: Aarav Mehta
Experience: 5 years
Skills: Python, SQL, Machine Learning, AWS, Docker
Recent Role: Data Scientist
Project Experience: Built a customer churn prediction system and deployed an ML API on AWS.
Recruiter Note: Strong technical profile; communication skills need to be validated during interview.
"""


# ============================================================
# EXPERIMENT 1: ZERO-SHOT PROMPTING
# ============================================================

print("\n" + "=" * 70)
print("EXPERIMENT 1 - ZERO-SHOT PROMPTING")
print("=" * 70)

zero_shot_prompt = f"""
Analyze the following candidate profile for a Data Scientist role.

Candidate information:
{candidate_info}

Tasks:
1. Summarize the candidate profile.
2. Identify key technical strengths.
3. Identify areas that should be validated during the interview.
4. Classify the candidate fit as High, Medium, or Low.
5. Generate three relevant technical interview questions.

Use only the information provided.
Do not invent qualifications, certifications, employment history,
education, or personal characteristics.
"""

response = client.chat.completions.create(
    model="llama-3.3-70b-versatile",
    messages=[
        {
            "role": "user",
            "content": zero_shot_prompt
        }
    ],
    temperature=0.2
)

zero_shot_output = response.choices[0].message.content

print("\nZERO-SHOT OUTPUT:")
print(zero_shot_output)


# ============================================================
# EXPERIMENT 2: ROLE-BASED PROMPTING
# ============================================================

print("\n" + "=" * 70)
print("EXPERIMENT 2 - ROLE-BASED PROMPTING")
print("=" * 70)

role_based_prompt = f"""
You are an experienced technical recruiter specializing in
Data Science and Machine Learning hiring.

Your task is to screen a candidate for a Data Scientist position.

Candidate information:
{candidate_info}

As a technical recruiter:

1. Provide a concise recruiter-friendly candidate summary.
2. Identify the candidate's strongest technical skills.
3. Identify strengths relevant to a Data Scientist role.
4. Identify areas that must be validated during the interview.
5. Classify the apparent role fit as High, Medium, or Low.
6. Provide exactly three technical interview questions.

Important constraints:
- Use ONLY the supplied candidate information.
- Do not invent education, certifications, companies, projects,
  employment history, or other qualifications.
- Do not make assumptions about protected or sensitive attributes.
- Do not infer information that is not explicitly provided.
- Base the role-fit decision only on job-relevant information.

Clearly distinguish facts from areas requiring validation.
"""

response = client.chat.completions.create(
    model="llama-3.3-70b-versatile",
    messages=[
        {
            "role": "user",
            "content": role_based_prompt
        }
    ],
    temperature=0.2
)

role_based_output = response.choices[0].message.content

print("\nROLE-BASED OUTPUT:")
print(role_based_output)


# ============================================================
# EXPERIMENT 3: FEW-SHOT PROMPTING
# ============================================================

print("\n" + "=" * 70)
print("EXPERIMENT 3 - FEW-SHOT PROMPTING")
print("=" * 70)

few_shot_prompt = f"""
You are a recruitment screening assistant for Data Scientist roles.

Your task is to analyze candidate information using the same
reasoning and output pattern demonstrated in the examples.

IMPORTANT:
Use only the supplied information.
Never invent qualifications or unsupported facts.

------------------------------------------------------------
EXAMPLE 1
------------------------------------------------------------

Candidate:
Experience: 4 years
Skills: Python, SQL, Machine Learning
Recent Role: Data Analyst
Project Experience: Built predictive analytics models.

Expected approach:
- Identify relevant technical skills.
- Mention the predictive modeling experience.
- Identify missing information that should be validated.
- Give a High, Medium, or Low fit based only on the supplied data.
- Suggest technical interview questions.

------------------------------------------------------------
EXAMPLE 2
------------------------------------------------------------

Candidate:
Experience: 2 years
Skills: Python
Recent Role: Junior Developer
Project Experience: Built basic Python applications.

Expected approach:
- Identify Python as the main technical skill.
- Avoid assuming Machine Learning experience.
- Identify the lack of supplied Data Science experience as
  something to validate.
- Give a High, Medium, or Low fit based only on the supplied data.
- Suggest relevant technical questions.

------------------------------------------------------------
TARGET CANDIDATE
------------------------------------------------------------

{candidate_info}

Perform the same type of analysis.

Return:
1. Candidate summary
2. Key technical skills
3. Strengths
4. Areas to validate
5. Role fit: High, Medium, or Low
6. Exactly three technical interview questions

Do not invent information.
"""

response = client.chat.completions.create(
    model="llama-3.3-70b-versatile",
    messages=[
        {
            "role": "user",
            "content": few_shot_prompt
        }
    ],
    temperature=0.2
)

few_shot_output = response.choices[0].message.content

print("\nFEW-SHOT OUTPUT:")
print(few_shot_output)


# ============================================================
# EXPERIMENT 4: FINAL STRUCTURED OUTPUT PROMPT
# ============================================================

print("\n" + "=" * 70)
print("EXPERIMENT 4 - STRUCTURED OUTPUT")
print("=" * 70)

structured_prompt = f"""
You are TalentSense AI, an enterprise recruitment screening assistant.

Analyze the following candidate for a Data Scientist role.

Candidate information:
{candidate_info}

Return ONLY valid JSON.

The JSON must contain exactly these fields:

{{
    "candidate_summary": "concise summary",
    "key_skills": [],
    "strengths": [],
    "areas_to_validate": [],
    "role_fit": "High, Medium, or Low",
    "recommended_interview_questions": []
}}

Rules:

1. Use only the supplied candidate information.
2. Do not invent qualifications.
3. Do not invent certifications.
4. Do not invent employment history.
5. Do not invent education.
6. Do not infer personal or protected characteristics.
7. Do not assume skills that are not explicitly mentioned.
8. role_fit must be exactly one of:
   High
   Medium
   Low
9. Provide exactly three interview questions.
10. Interview questions must be relevant to Data Science,
    Machine Learning, Python, SQL, AWS, or the supplied project.
11. Areas to validate should clearly identify information that
    requires confirmation during an interview.
"""

response = client.chat.completions.create(
    model="llama-3.3-70b-versatile",
    messages=[
        {
            "role": "user",
            "content": structured_prompt
        }
    ],
    temperature=0.1
)

structured_output = response.choices[0].message.content

print("\nSTRUCTURED OUTPUT:")
print(structured_output)


# ============================================================
# VALIDATE STRUCTURED JSON
# ============================================================

print("\n" + "=" * 70)
print("JSON VALIDATION")
print("=" * 70)

try:

    structured_data = json.loads(structured_output)

    print("\nValid JSON received! ✅")

    print("\nFormatted JSON:")
    print(json.dumps(structured_data, indent=4))

except json.JSONDecodeError:

    print("\nWARNING: Model did not return valid JSON.")
    print("Raw response:")
    print(structured_output)


# ============================================================
# PROMPT COMPARISON
# ============================================================

print("\n" + "=" * 70)
print("PROMPT ENGINEERING COMPARISON")
print("=" * 70)

print("""
1. ZERO-SHOT PROMPTING
   - No examples were provided.
   - The model received the task and candidate information directly.
   - Useful for simple and flexible tasks.
   - Output formatting may vary.

2. ROLE-BASED PROMPTING
   - The model was given the role of an experienced technical recruiter.
   - Provides stronger business context.
   - Helps focus the response on recruiter-relevant information.

3. FEW-SHOT PROMPTING
   - Examples were provided before the target candidate.
   - Helps demonstrate the expected reasoning and response pattern.
   - Can improve consistency.

4. STRUCTURED OUTPUT
   - Explicit JSON fields were requested.
   - More predictable and machine-readable.
   - Better suited for downstream applications.

5. PROMPT REFINEMENT
   - Added explicit constraints.
   - Added responsible AI instructions.
   - Restricted role-fit values.
   - Required exactly three interview questions.
   - Prevented unsupported assumptions.
""")


# ============================================================
# RESPONSIBLE AI OBSERVATIONS
# ============================================================

print("\n" + "=" * 70)
print("RESPONSIBLE AI / HALLUCINATION OBSERVATIONS")
print("=" * 70)

print("""
Observation 1:
The model may try to infer additional qualifications or experience
from the candidate's technical skills. These assumptions should not
be treated as facts unless they are explicitly provided.

Observation 2:
The role-fit classification can vary depending on the prompt.
Adding role context, examples, and explicit constraints can improve
consistency.

Observation 3:
Recruiter notes such as communication skills should be treated as
an area for interview validation rather than as a definitive
judgment about the candidate.

Observation 4:
Structured JSON output improves predictability, but the generated
information should still be validated before being used in a real
recruitment workflow.
""")


# ============================================================
# FINAL RECOMMENDATION
# ============================================================

print("\n" + "=" * 70)
print("FINAL RECOMMENDATION")
print("=" * 70)

print("""
For the TalentSense AI prototype, the final structured-output
prompt is the most suitable design.

Reason:
- It provides clear role and task context.
- It defines explicit constraints.
- It prevents unsupported assumptions.
- It produces predictable fields.
- It is easier for downstream applications to consume.
- It supports consistent recruiter-facing screening summaries.

For production use, human recruiter review should remain part of
the decision process.
""")

print("\n" + "=" * 70)
print("TALENTSENSE AI PROJECT COMPLETED")
print("=" * 70)