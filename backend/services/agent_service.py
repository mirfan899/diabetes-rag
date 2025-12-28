import os
import json
from typing import Dict, Any
from langchain_community.chat_models import ChatOllama
from langchain_classic.agents import AgentExecutor
from langchain_classic.agents.react.agent import create_react_agent
from langchain_core.prompts import PromptTemplate
from .tools import DiabetesTools

class AgentService:
    def __init__(self):
        # Initialize LLM
        # using low temperature for more deterministic tool usage
        self.llm = ChatOllama(
            model=os.getenv("OLLAMA_LLM_MODEL", "gemma:2b"),
            temperature=0,
            base_url=os.getenv("OLLAMA_HOST", "http://localhost:11434")
        )
        
        # Initialize Tools
        self.diabetes_tools = DiabetesTools()
        self.tools = self.diabetes_tools.get_tools()
        
        # Define a simplified ReAct prompt optimized for smaller models
        # Standard ReAct prompts can be too verbose for 2B models
        template = """Answer the following questions as best you can. You have access to the following tools:

{tools}

Use the following format:

Question: the input question you must answer
Thought: you should always think about what to do
Action: the action to take, should be one of [{tool_names}]
Action Input: the input to the action
Observation: the result of the action
... (this Thought/Action/Action Input/Observation can repeat N times)
Thought: I now know the final answer
Final Answer: the final answer to the original input question

Begin!

Question: {input}
Thought:{agent_scratchpad}"""

        self.prompt = PromptTemplate.from_template(template)
        
        # Create Agent
        self.agent = create_react_agent(self.llm, self.tools, self.prompt)
        self.agent_executor = AgentExecutor(
            agent=self.agent, 
            tools=self.tools, 
            verbose=True,
            handle_parsing_errors=True, # Important for small models that might mess up formatting
            max_iterations=5
        )

    def _format_patient_data(self, patient_data: Dict) -> str:
        """Convert patient dictionary to a readable string for the agent."""
        lines = ["Patient Clinical Data:"]
        for key, value in patient_data.items():
            if value:
                clean_key = key.replace("Percent", " %").replace("MgDl", " mg/dL").replace("Kg", " kg").replace("Cm", " cm")
                lines.append(f"- {clean_key}: {value}")
        return "\n".join(lines)

    def run_agent(self, patient_data: Dict) -> Dict:
        """
        Run the agent loop to generate recommendations.
        """
        patient_context = self._format_patient_data(patient_data)
        
        # We need to coerce the agent to output the specific JSON format we need.
        # So we include the output format instructions in the input "Question".
        
        task_description = f"""
{patient_context}

You are a medical AI assistant. Your goal is to provide evidence-based diabetes recommendations.
1. Analyze the patient data to identify key issues (e.g., high HbA1c, comorbidities, symptoms).
2. Use the 'search_clinical_guidelines' tool to find specific treatment protocols for these issues.
   - Example: Search for "Type 2 diabetes high HbA1c treatment"
   - Example: Search for "diabetes medication for kidney disease" if relevant.
3. Based on the findings, generate a FINAL ANSWER in strict JSON format.

The Final Answer MUST be a valid JSON object with this exact structure:
{{
  "medicines": [
    {{
      "medicine_name": "<name>",
      "quantity_dose_strength": "<dose>",
      "reason": ["<reason>"],
      "reference": "<source>"
    }}
  ],
  "lifestyle": ["<advice>"],
  "notes": ["<note>"],
  "investigations": ["<test>"]
}}
"""
        
        try:
            print("Agent: Starting execution...")
            result = self.agent_executor.invoke({"input": task_description})
            output_text = result["output"]
            
            # Extract JSON from the output (it might be wrapped in text)
            return self._extract_json(output_text)
            
        except Exception as e:
            print(f"Agent Error: {e}")
            return {
                "medicines": [],
                "lifestyle": ["Error generating recommendations. Please consult a doctor."],
                "notes": [f"System encountered an error: {str(e)}"],
                "investigations": []
            }

    def _extract_json(self, text: str) -> Dict:
        """Helper to find and parse JSON blob from agent text."""
        try:
            # Try finding the first { and last }
            start = text.find('{')
            end = text.rfind('}') + 1
            if start != -1 and end != -1:
                json_str = text[start:end]
                return json.loads(json_str)
            return json.loads(text)
        except:
            print(f"Failed to parse JSON from: {text}")
            return {
                "medicines": [],
                "lifestyle": ["Could not parse agent output."],
                "notes": ["Agent output was not valid JSON."],
                "investigations": []
            }
