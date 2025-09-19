from typing import Iterator
from agno.agent import Agent, RunResponse
from agno.team import Team
from agno.models.google import Gemini
from agno.media import File

import pypdf, requests, json
# def revamp(resume, jobRole, jobDescription):
def revamp(resumePath, jobRole, jobDescriptionPath=None, jdURL=None):
    # Load YAML template
    with open("template.yaml", "r", encoding="utf-8") as f:
        yamlContent = f.read()

    jobDescription = None

    # CASE 1: Extract JD text from uploaded PDF
    if jobDescriptionPath:
        with open(jobDescriptionPath, "rb") as f:
            reader = pypdf.PdfReader(f)
            jobDescription = "".join([page.extract_text() for page in reader.pages])

        # Call keyword extractor API with JD file
        files = {"jd": open(jobDescriptionPath, "rb")}
        url = "https://ats-service-b6gx.onrender.com/keywords"
        response = requests.post(url, files=files)
        if response.status_code == 200:
            data = response.json()
            with open("keywords.json", "w", encoding="utf-8") as f:
                json.dump(data, f, indent=4, ensure_ascii=False)
        else:
            raise ValueError(f"JD keyword extraction failed: {response.text}")

    # CASE 2: JD is provided as a URL
    elif jdURL:
        resp = requests.get(jdURL)
        if resp.status_code == 200:
            jobDescription = resp.text
        else:
            raise ValueError(f"Failed to fetch JD from URL: {jdURL}")

        # Call keyword extractor API with JD URL
        url = "https://ats-service-b6gx.onrender.com/keywords"
        response = requests.post(url, data={"jd": jdURL})
        if response.status_code == 200:
            data = response.json()
            with open("keywords.json", "w", encoding="utf-8") as f:
                json.dump(data, f, indent=4, ensure_ascii=False)
        else:
            raise ValueError(f"JD keyword extraction failed from URL: {response.text}")

    else:
        raise ValueError("❌ No Job Description provided (either upload a PDF or provide a URL).")

    with open("keywords.json", "r", encoding="utf-8") as f:
        jsonContent = f.read()

    ATSOptimizerAgent = Agent(
        name="ATSOptimizer",
        model=Gemini(id="gemini-2.5-flash", api_key="AIzaSyAfwyPa6_YoiV5iFFn5jKvanA0M50FYalw", temperature=0),
        role="Creates an ATS-optimized YAML file based on resume and JD with guaranteed 85+ ATS score using strict keyword alignment and formatting rules.",
        instructions = [
            "Input: resume.pdf, JD.pdf, template.yaml",

            # YAML RULES
            "YAML STRICT RULES:",
            "- Colons (:) only for YAML separators. Forbidden in content text.",
            "- Replace content colons with connectors (and, with, for, by, including).",
            "- summary: must be a single bullet with one paragraph.",
            "- Skills: use 'details:' only, never 'summary:'.",
            "- Dates format: YYYY-MM, lowercase 'present'.",
            "- No fabricated dates. If start/end not in resume, omit them.",
            "- No fabricated dates for projects or experience → only include if explicitly present in the resume.",
            "- Standardize: 'Computer Science Engineering', certifications without colons.",
            "- Degrees must use short form (e.g., Bachelor of Technology → BTech).",
            "- Only include university-level degrees (Bachelor, Master, PhD).",
            "- No placeholders. No contact info.",
            "- Any mention of position of responsibility must be shifted to 'achievements:' with a brief explanation.",

            # STRICT ONE-PAGE RULE
            "- Resume must strictly fit one page in YAML export.",
            "- If content exceeds one page, aggressively shorten summary and experience bullets.",
            "- Shorten by removing filler words and redundant phrases but keep:",
            "   • All JD keywords (95% required + 90% preferred).",
            "   • CAR structure (Challenge–Action–Result).",
            "   • Quantified outcomes (numbers, %, metrics).",
            "- If space still exceeds one page:",
            "   • Prioritize JD keywords and quantified achievements over generic soft skills.",
            "   • Condense 2–3 related bullets into one concise CAR bullet with denser keyword usage.",
            "   • Shorten the summary first before cutting experience points.",
            "- No loss of required keywords or ATS alignment even when shortening.",

            # KEYWORD INTEGRATION
            "Extract all the keywords from the JSON file and include them in the resume, it's a must.",
            "If the JD has keywords such as: recommendation systems, transfer learning, etc, you can follow this example to include such phrases",
            "Your project says: Engineered an ML pipeline for Malicious URL Detection, achieving 92% accuracy. 👉 You could extend it slightly to: Engineered an ML pipeline for Malicious URL Detection, applying techniques similar to recommendation and classification systems, achieving 92% accuracy.",
            "The goal is to not lie, but still integrate those keywords.",
            "JD KEYWORDS (95%+ integration required):",
            "- Python (3–6 months req → resume shows 9+ months expert).",
            "- ML libraries (TensorFlow, OpenCV, scikit-learn).",
            "- AI orchestration (LangChain, CrewAI, Phidata).",
            "- AI agents, agentic systems/workflows.",
            "- SQL, ETL, data manipulation, preprocessing.",
            "- Healthcare applications, clinical outcomes, operational efficiency.",
            "- Analytical, problem-solving, teamwork, communication.",

            "Preferred Skills (90%+ where applicable):",
            "- Cloud platforms (Azure + mention AWS/GCP).",
            "- Data visualization (Matplotlib, Seaborn, Plotly).",
            "- DevOps/model deployment (Docker, production).",
            "- Version control (Git).",

            # WRITING STYLE
            "CAR Method for bullets (Challenge-Action-Result with JD skills).",
            "- Integrate 8–10 JD keywords per bullet.",
            "- Quantified results mandatory.",
            "- Maintain healthcare/efficiency context where possible.",
            "- Shortened bullets must still follow CAR method.",

            # SUMMARY
            "Summary must integrate 25–30 JD keywords naturally in one paragraph.",
            "- If too long, shorten while preserving keywords and role relevance.",

            # OUTPUT VALIDATION
            "Checklist before output:",
            "✓ Python expert level exceeds JD requirement.",
            "✓ 95% required + 90% preferred skills integrated.",
            "✓ Healthcare context maintained.",
            "✓ Keywords dense across summary, skills, experience, projects.",
            "✓ All bullets follow CAR method with metrics.",
            "✓ YAML format clean (no colons in content, skills use details:, dates consistent).",
            "✓ No fake dates. Omit if not present in original (applies to both projects and experience).",
            "✓ Resume strictly fits in one page → shortened bullet points or summary if needed, with keywords and CAR method intact.",
            "✓ Any position of responsibility is recorded under 'achievements:' with a brief explanation.",

            "Final Output: resume.yaml fully ATS-optimized, no formatting violations, guaranteed 85+ ATS score."
        ],
        add_datetime_to_instructions=True,
    )

    response = ATSOptimizerAgent.run(
        f"Revamp the uploaded resume with the Job Description uploaded by the user, I have also attached a jd_keywords.json file that contains all the main keywords from the JD, you need to include 100% of these keywords in the revamp resume. template.yaml: {yamlContent}, Job Role: {jobRole}, Job Description:\n{jobDescription}, JD Keywords:\n{jsonContent}", files=[File(filepath=resumePath, url=jdURL)]

    )
    print(response.content)
    with open("resume.yaml", "w", encoding="utf-8") as f:
        f.write(response.content if response.content is not None else "")

revamp("/Users/arreyanhamid/Developer/ai-resume/resumes/Garv.pdf","AI Engineer", jdURL= "https://buvnzjfspowdttkgohtb.supabase.co/storage/v1/object/public/jobDescriptions/AIJD.pdf")