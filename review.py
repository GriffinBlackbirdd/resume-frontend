# src/config/crew.py

from crewai import Agent, Crew, Process, Task
from crewai.project import CrewBase, agent, crew, task
from crewai import LLM


llm = LLM(
    model="gemini/gemini-2.5-flash",
    api_key="AIzaSyBaLirmENGf4Z-oHlQ1ecLCJN8Hdznzwo4",
)
# search_tool = SerperDevTool()
import os
import pypdf

def takeInputs(resumePath, jdPath):
    """
    Extracts text from resume and job description.
    Supports both .pdf and .txt files.
    """

    def extract_text(file_path):
        ext = os.path.splitext(file_path)[1].lower()

        if ext == ".pdf":
            with open(file_path, "rb") as f:
                reader = pypdf.PdfReader(f)
                return "".join(page.extract_text() or "" for page in reader.pages)

        elif ext == ".txt":
            with open(file_path, "r", encoding="utf-8") as f:
                return f.read()

        else:
            raise ValueError(f"Unsupported file type: {ext}. Please provide .pdf or .txt")

    jobDescription = extract_text(jdPath) if jdPath else None
    resumeDescription = extract_text(resumePath) if resumePath else None

    return jobDescription, resumeDescription



@CrewBase
class GapAnalysisCrew():

  """Gap Analysis and Upskilling crew"""

  @agent
  def gap_analyst(self) -> Agent:
    return Agent(
      config=self.agents_config['gap_analyst'], # type: ignore[index]
      llm=llm,
      verbose=True
    )

  @agent
  def upskilling_planner(self) -> Agent:
    return Agent(
      config=self.agents_config['upskilling_planner'],  # type: ignore[index]
      llm=llm,

      verbose=True
    )

  @agent
  def project_recommender(self) -> Agent:
    return Agent(
      config=self.agents_config['project_recommender'],  # type: ignore[index]
      llm=llm,

      verbose=True,
    )

  @agent
  def team_leader(self) -> Agent:
    return Agent(
      config=self.agents_config['team_leader'],  # type: ignore[index]
      llm=llm,

      verbose=True
    )

  @task
  def gap_analysis_task(self) -> Task:
    return Task(
      config=self.tasks_config['gap_analysis_task']  # type: ignore[index]
    )

  @task
  def upskilling_plan_task(self) -> Task:
    return Task(
      config=self.tasks_config['upskilling_plan_task']  # type: ignore[index]
    )

  @task
  def project_recommendation_task(self) -> Task:
    return Task(
      config=self.tasks_config['project_recommendation_task']  # type: ignore[index]
    )

  @task
  def team_leader_task(self) -> Task:
    return Task(
      config=self.tasks_config['team_leader_task']  # type: ignore[index]
    )

  @crew
  def crew(self) -> Crew:
    return Crew(
      agents=[
        self.gap_analyst(),
        self.upskilling_planner(),
        self.project_recommender(),
        self.team_leader()
      ],
      tasks=[
        self.gap_analysis_task(),
        self.upskilling_plan_task(),
        self.project_recommendation_task(),
        self.team_leader_task()
      ],
      process=Process.sequential
    )

if __name__ == "__main__":
  jd_text, resume_text = takeInputs(
      "/Users/arreyanhamid/Developer/ai-resume/resumes/Garv.pdf",
      "/Users/arreyanhamid/Developer/ai-resume/jd.txt"
  )

  crew_instance = GapAnalysisCrew()
  final_result = crew_instance.crew().kickoff(inputs={"resume": resume_text, "jd": jd_text})
  print("\n==== Final Gap Analysis Report ====\n")
  print(final_result)
