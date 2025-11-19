from http import HTTPStatus


def test_get_activities(client):
    res = client.get("/activities")
    assert res.status_code == HTTPStatus.OK
    data = res.json()
    assert isinstance(data, dict)
    # Ensure a known activity is present
    assert "Chess Club" in data


def test_signup_and_unregister_flow(client):
    activity = "Basketball Team"
    email = "testuser@example.com"

    # Initially not signed up
    data = client.get("/activities").json()
    assert email not in data[activity]["participants"]

    # Sign up
    res = client.post(f"/activities/{activity}/signup?email={email}")
    assert res.status_code == HTTPStatus.OK
    assert email in client.get("/activities").json()[activity]["participants"]

    # Duplicate sign-up should fail
    res = client.post(f"/activities/{activity}/signup?email={email}")
    assert res.status_code == HTTPStatus.BAD_REQUEST

    # Unregister
    res = client.post(f"/activities/{activity}/unregister?email={email}")
    assert res.status_code == HTTPStatus.OK
    assert email not in client.get("/activities").json()[activity]["participants"]

    # Unregister again should fail
    res = client.post(f"/activities/{activity}/unregister?email={email}")
    assert res.status_code == HTTPStatus.BAD_REQUEST


def test_signup_activity_not_found(client):
    res = client.post("/activities/NoSuchActivity/signup?email=a@b.com")
    assert res.status_code == HTTPStatus.NOT_FOUND


def test_unregister_activity_not_found(client):
    res = client.post("/activities/NoSuchActivity/unregister?email=a@b.com")
    assert res.status_code == HTTPStatus.NOT_FOUND
