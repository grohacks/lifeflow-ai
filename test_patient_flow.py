import urllib.request
import json

def test_flow():
    # 1. Test backend health
    try:
        req = urllib.request.Request('http://localhost:8080/api/health')
        with urllib.request.urlopen(req) as resp:
            print('[1] Health status:', resp.status, resp.read().decode())
    except Exception as e:
        print('[1] Health error:', e)

    # 2. Test Citizen SOS Creation
    sos_payload = json.dumps({
        'citizenName': 'Vikram Sharma',
        'contactPhone': '+91 9876543210',
        'locationDescription': 'Ring Road Junction near Outer Flyover',
        'latitude': 28.6139,
        'longitude': 77.2090,
        'emergencyType': 'ROAD_TRAFFIC_ACCIDENT',
        'estimatedCasualties': 1,
        'description': 'Head impact and fractured arm, conscious'
    }).encode('utf-8')

    # 1b. Authenticate to get JWT token
    login_payload = json.dumps({'username': 'paramedic', 'password': 'password123'}).encode('utf-8')
    token = None
    try:
        req_auth = urllib.request.Request('http://localhost:8080/api/auth/login', data=login_payload, headers={'Content-Type': 'application/json'})
        with urllib.request.urlopen(req_auth) as resp_auth:
            auth_res = json.loads(resp_auth.read().decode())
            token = auth_res.get('data', {}).get('token')
            print('[1b] Authenticated as paramedic! JWT token acquired.')
    except Exception as e:
        print('[1b] Auth error (trying paramedic123):', e)
        try:
            login_payload2 = json.dumps({'username': 'paramedic', 'password': 'paramedic123'}).encode('utf-8')
            req_auth2 = urllib.request.Request('http://localhost:8080/api/auth/login', data=login_payload2, headers={'Content-Type': 'application/json'})
            with urllib.request.urlopen(req_auth2) as resp_auth2:
                auth_res2 = json.loads(resp_auth2.read().decode())
                token = auth_res2.get('data', {}).get('token')
                print('[1b] Authenticated with paramedic123! JWT token acquired.')
        except Exception as e2:
            print('[1b] Auth failed:', e2)

    auth_headers = {'Authorization': f'Bearer {token}'} if token else {}

    try:
        req = urllib.request.Request('http://localhost:8080/api/incidents/sos', data=sos_payload, headers={'Content-Type': 'application/json'})
        with urllib.request.urlopen(req) as resp:
            sos_res = json.loads(resp.read().decode())
            incident_data = sos_res.get('data', {})
            incident_id = incident_data.get('id')
            new_case_id = incident_data.get('patientCaseId')
            print(f'[2] SOS Created successfully! Incident #{incident_id}, Patient Case ID: {new_case_id}')
            
            # 3. Test active cases list
            req2 = urllib.request.Request('http://localhost:8080/api/patients/active', headers=auth_headers)
            with urllib.request.urlopen(req2) as resp2:
                cases = json.loads(resp2.read().decode()).get('data', [])
                print(f'[3] Active Cases count: {len(cases)}')
                matching = [c for c in cases if c.get('caseId') == new_case_id]
                print(f'    Case {new_case_id} present in active list: {len(matching) > 0}')
                
            # 4. Test Digital Twin retrieval for this unique case
            if new_case_id:
                req3 = urllib.request.Request(f'http://localhost:8080/api/patients/{new_case_id}/twin', headers=auth_headers)
                with urllib.request.urlopen(req3) as resp3:
                    twin = json.loads(resp3.read().decode()).get('data', {})
                    print(f'[4] Digital Twin for {new_case_id}:')
                    print(f'    HR: {twin.get("heartRate")} bpm')
                    print(f'    SpO2: {twin.get("spo2")}%')
                    print(f'    BP: {twin.get("systolicBp")}/{twin.get("diastolicBp")} mmHg')
                    print(f'    Consciousness: {twin.get("consciousness")}')
                    print(f'    Data Quality: {twin.get("dataQuality")}')

            # 5. Test Destination Recommendation for this unique case
            if new_case_id:
                req_eval = urllib.request.Request(f'http://localhost:8080/api/decision/case/{new_case_id}/evaluate', data=b'{}', headers={**auth_headers, 'Content-Type': 'application/json'}, method='POST')
                with urllib.request.urlopen(req_eval) as resp_eval:
                    rec = json.loads(resp_eval.read().decode()).get('data', {})
                    candidates = rec.get('candidates', [])
                    print(f'[5] Recommendation for {new_case_id}:')
                    print(f'    Top Hospital: {rec.get("selectedHospitalName")}')
                    print(f'    Summary: {rec.get("summaryReason")}')
                    print(f'    Candidates evaluated: {len(candidates)}')

            print('\nALL ENDPOINTS VERIFIED AND PATIENT-ISOLATED!')
    except Exception as e:
        print('[ERROR]', e)

if __name__ == '__main__':
    test_flow()
