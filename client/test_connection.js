// Thay đổi IP này thành IP thực tế của máy chủ Node.js của bạn
private static final String SERVER_URL = "ws://192.168.1.5:3001";
public void connectToServer(String minecraftIp, String username) {
    JSONObject json = new JSONObject();
    try {
        json.put("action", "connect");
        json.put("serverIp", minecraftIp);
        json.put("username", username);

        if (webSocket != null) {
            webSocket.send(json.toString());
        }
    } catch (JSONException e) {
        e.printStackTrace();
    }
}
