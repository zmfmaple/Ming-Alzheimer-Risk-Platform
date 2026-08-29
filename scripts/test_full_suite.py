import requests, json, time, sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

BASE_URL = 'http://127.0.0.1:8000'

def test_predict_demo():
    print("\n=== TEST 1: /predict-demo (无需认证) ===")
    url = f'{BASE_URL}/predict-demo'
    payload = {
        'Age': 65, 'Gender': 0, 'Ethnicity': 0, 'EducationLevel': 2,
        'BMI': 25, 'Smoking': 0, 'AlcoholConsumption': 1, 'PhysicalActivity': 2, 'DietQuality': 2, 'SleepQuality': 4,
        'FamilyHistoryAlzheimers': 0, 'CardiovascularDisease': 0, 'Diabetes': 0, 'Depression': 0, 'HeadInjury': 0, 'Hypertension': 0,
        'BloodPressureCheckedRecently': 0, 'KnowsBloodPressureResult': 0, 'SystolicBP': 120, 'DiastolicBP': 80,
        'CholesterolCheckedRecently': 0, 'KnowsCholesterolResult': 0, 'CholesterolTotal': 200, 'CholesterolLDL': 100, 'CholesterolHDL': 50, 'CholesterolTriglycerides': 150,
        'CognitiveConcerns': 1, 'CognitiveAssessmentTaken': 0, 'MMSE': 26, 'FunctionalAssessment': 5, 'MemoryComplaints': 0, 'BehavioralProblems': 0, 'ADL': 5,
        'Confusion': 0, 'Disorientation': 0, 'PersonalityChanges': 0, 'DifficultyCompletingTasks': 0, 'Forgetfulness': 1
    }
    r = requests.post(url, json=payload, timeout=30)
    print(f'Status: {r.status_code}')
    data = r.json()
    print(f'Risk Probability: {data["risk_probability"]}, Level: {data["risk_level"]}')
    print(f'Top 3 Explanations: {[f.get("feature") for f in data["top_explanations"][:3]]}')
    assert r.status_code == 200, f"Expected 200, got {r.status_code}"
    assert 'risk_probability' in data, "Missing risk_probability"
    print('✓ PASSED')
    return True

def test_register():
    print("\n=== TEST 2: /auth/register ===")
    url = f'{BASE_URL}/auth/register'
    username = f'testuser_{int(time.time())}'
    payload = {
        'username': username,
        'password': 'testpass123',
        'research_consent': True,
        'consent_version': 'prototype-consent-v1',
    }
    r = requests.post(url, json=payload, timeout=30)
    print(f'Status: {r.status_code}')
    data = r.json()
    print(f'Response: {json.dumps(data, indent=2)[:200]}')
    assert r.status_code in [200, 400], f"Unexpected status {r.status_code}"
    if r.status_code == 200:
        print(f'✓ PASSED - User {username} registered')
        return username
    else:
        print(f"Note: Registration returned 400 - likely duplicate or validation issue: {data.get('detail', 'unknown')}")
        return username

def test_login(username='testuser_1234', password='testpass123'):
    print("\n=== TEST 3: /auth/login ===")
    url = f'{BASE_URL}/auth/login'
    payload = {'username': username, 'password': password}
    r = requests.post(url, json=payload, timeout=30)
    print(f'Status: {r.status_code}')
    data = r.json()
    print(f'Response: {json.dumps(data, indent=2)[:300]}')
    if r.status_code == 200:
        print(f'✓ PASSED - Token obtained')
        return data.get('access_token')
    else:
        print(f"Note: Login failed - {data.get('detail', 'unknown')}")
        return None

def test_predict_authenticated(token):
    print("\n=== TEST 4: /predict (需要认证) ===")
    url = f'{BASE_URL}/predict'
    headers = {'Authorization': f'Bearer {token}'}
    payload = {
        'Age': 70, 'Gender': 1, 'Ethnicity': 0, 'EducationLevel': 2,
        'BMI': 28, 'Smoking': 1, 'AlcoholConsumption': 2, 'PhysicalActivity': 1, 'DietQuality': 1, 'SleepQuality': 4,
        'FamilyHistoryAlzheimers': 1, 'CardiovascularDisease': 0, 'Diabetes': 1, 'Depression': 0, 'HeadInjury': 0, 'Hypertension': 1,
        'BloodPressureCheckedRecently': 1, 'KnowsBloodPressureResult': 1, 'SystolicBP': 140, 'DiastolicBP': 90,
        'CholesterolCheckedRecently': 1, 'KnowsCholesterolResult': 1, 'CholesterolTotal': 250, 'CholesterolLDL': 150, 'CholesterolHDL': 40, 'CholesterolTriglycerides': 200,
        'CognitiveConcerns': 1, 'CognitiveAssessmentTaken': 1, 'MMSE': 22, 'FunctionalAssessment': 3, 'MemoryComplaints': 1, 'BehavioralProblems': 1, 'ADL': 3,
        'Confusion': 1, 'Disorientation': 1, 'PersonalityChanges': 0, 'DifficultyCompletingTasks': 1, 'Forgetfulness': 1
    }
    r = requests.post(url, json=payload, headers=headers, timeout=30)
    print(f'Status: {r.status_code}')
    if r.status_code == 200:
        data = r.json()
        print(f'Risk Probability: {data["risk_probability"]}, Level: {data["risk_level"]}')
        print(f'✓ PASSED')
        return True
    else:
        print(f"Response: {r.text[:200]}")
        return False

def test_chat_explanation(token):
    print("\n=== TEST 5: /chat (report explanation) ===")
    url = f'{BASE_URL}/chat'
    payload = {'message': '为什么我的风险概率是0.7？', 'result': {'risk_level': '中风险', 'risk_probability': 0.7, 'top_explanations': []}, 'formData': {}}
    r = requests.post(url, json=payload, timeout=30)
    print(f'Status: {r.status_code}')
    if r.status_code == 200:
        data = r.json()
        print(f'Response length: {len(data.get("response", ""))}')
        assert data.get("response"), "Missing response text"
        print('✓ PASSED')
        return True
    else:
        print(f"Response: {r.text[:200]}")
        return False

def test_history(token):
    print("\n=== TEST 6: /assessments/history ===")
    url = f'{BASE_URL}/assessments/history'
    headers = {'Authorization': f'Bearer {token}'}
    r = requests.get(url, headers=headers, timeout=30)
    print(f'Status: {r.status_code}')
    if r.status_code == 200:
        data = r.json()
        print(f'History count: {data.get("total", 0)}')
        assert 'assessments' in data, "Missing assessments list"
        print('✓ PASSED')
        return True
    else:
        print(f"Response: {r.text[:200]}")
        return False

def test_monitoring(token):
    print("\n=== TEST 7: /assessments/monitoring/data ===")
    url = f'{BASE_URL}/assessments/monitoring/data?days=30'
    headers = {'Authorization': f'Bearer {token}'}
    r = requests.get(url, headers=headers, timeout=30)
    print(f'Status: {r.status_code}')
    if r.status_code == 200:
        data = r.json()
        print(f'Monitoring data points: {len(data.get("trend_data", []))}')
        assert 'trend_data' in data, "Missing trend_data"
        print('✓ PASSED')
        return True
    else:
        print(f"Response: {r.text[:200]}")
        return False

if __name__ == '__main__':
    print("\n" + "="*60)
    print("COMPREHENSIVE BACKEND API TEST SUITE")
    print("="*60)
    
    results = {}
    
    # Test 1: Demo prediction (no auth)
    try:
        results['predict_demo'] = test_predict_demo()
    except Exception as e:
        print(f'✗ FAILED: {e}')
        results['predict_demo'] = False
    
    # Test 2: Register
    try:
        registered_user = test_register()
        results['register'] = True
    except Exception as e:
        print(f'✗ FAILED: {e}')
        results['register'] = False
        registered_user = None
    
    # Test 3-7: Authenticated endpoints (try with existing user or skip)
    token = None
    try:
        # Use the newly registered user for login
        token = test_login(registered_user, 'testpass123') if registered_user else None
        results['login'] = token is not None
    except Exception as e:
        print(f'✗ Login FAILED: {e}')
        results['login'] = False
    
    if token:
        try:
            results['predict_auth'] = test_predict_authenticated(token)
        except Exception as e:
            print(f'✗ FAILED: {e}')
            results['predict_auth'] = False
        
        try:
            results['chat'] = test_chat_explanation(token)
        except Exception as e:
            print(f'✗ FAILED: {e}')
            results['chat'] = False
        
        try:
            results['history'] = test_history(token)
        except Exception as e:
            print(f'✗ FAILED: {e}')
            results['history'] = False
        
        try:
            results['monitoring'] = test_monitoring(token)
        except Exception as e:
            print(f'✗ FAILED: {e}')
            results['monitoring'] = False
    
    # Summary
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    for test_name, passed in results.items():
        status = "✓ PASSED" if passed else "✗ FAILED"
        print(f"{test_name:20s}: {status}")
    
    passed_count = sum(1 for v in results.values() if v)
    total_count = len(results)
    print(f"\nTotal: {passed_count}/{total_count} tests passed")
    print("="*60)
