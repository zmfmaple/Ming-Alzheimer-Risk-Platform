import requests, json
url='http://127.0.0.1:8000/predict-demo'
payload={
 'Age':65,'Gender':0,'Ethnicity':0,'EducationLevel':2,
 'BMI':25,'Smoking':0,'AlcoholConsumption':1,'PhysicalActivity':2,'DietQuality':2,'SleepQuality':4,
 'FamilyHistoryAlzheimers':0,'CardiovascularDisease':0,'Diabetes':0,'Depression':0,'HeadInjury':0,'Hypertension':0,
 'BloodPressureCheckedRecently':0,'KnowsBloodPressureResult':0,'SystolicBP':120,'DiastolicBP':80,
 'CholesterolCheckedRecently':0,'KnowsCholesterolResult':0,'CholesterolTotal':200,'CholesterolLDL':100,'CholesterolHDL':50,'CholesterolTriglycerides':150,
 'CognitiveConcerns':1,'CognitiveAssessmentTaken':0,'MMSE':26,'FunctionalAssessment':5,'MemoryComplaints':0,'BehavioralProblems':0,'ADL':5,
 'Confusion':0,'Disorientation':0,'PersonalityChanges':0,'DifficultyCompletingTasks':0,'Forgetfulness':1
}
print('Sending payload size', len(json.dumps(payload)))
r=requests.post(url,json=payload,timeout=30)
print('STATUS', r.status_code)
try:
    print(r.json())
except Exception as e:
    print('TEXT', r.text[:500])
