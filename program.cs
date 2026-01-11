using System;
using System.IO;
using System.Text;
using System.Text.Json;

class Program
{
    static void Main()
    {
        var stdin = Console.OpenStandardInput();
        var stdout = Console.OpenStandardOutput();
        var logPath = Path.Combine(Path.GetTempPath(), "com.example.nativehost.log");

        try
        {
            while (true)
            {
                // Read 4-byte length prefix
                byte[] lenBytes = new byte[4];
                int readLen = ReadExact(stdin, lenBytes, 0, 4);
                if (readLen == 0)
                    return; // EOF

                if (readLen < 4)
                {
                    File.AppendAllText(logPath,
                        $"{DateTime.UtcNow:o} Short length read: {readLen}{Environment.NewLine}");
                    return;
                }

                int payloadLen = BitConverter.ToInt32(lenBytes, 0);

                if (payloadLen <= 0)
                {
                    File.AppendAllText(logPath,
                        $"{DateTime.UtcNow:o} Invalid payload length: {payloadLen}{Environment.NewLine}");
                    continue;
                }

                byte[] buffer = new byte[payloadLen];
                int got = ReadExact(stdin, buffer, 0, payloadLen);

                if (got < payloadLen)
                {
                    File.AppendAllText(logPath,
                        $"{DateTime.UtcNow:o} Short payload read: expected={payloadLen} got={got}{Environment.NewLine}");
                    return;
                }

                // Strip UTF-8 BOM if present
                int offset = 0;
                if (buffer.Length >= 3 &&
                    buffer[0] == 0xEF &&
                    buffer[1] == 0xBB &&
                    buffer[2] == 0xBF)
                {
                    offset = 3;
                }

                string message = Encoding.UTF8.GetString(buffer, offset, buffer.Length - offset);

                // Debug info (first bytes + string preview)
                try
                {
                    File.AppendAllText(
                        logPath,
                        $"{DateTime.UtcNow:o} Received {payloadLen} bytes; first16: {BitConverter.ToString(buffer, 0, Math.Min(16, buffer.Length))}{Environment.NewLine}" +
                        $"{DateTime.UtcNow:o} As string (first 500): {message.Substring(0, Math.Min(500, message.Length))}{Environment.NewLine}"
                    );
                }
                catch
                {
                    // best-effort logging
                }

                // Parse JSON safely
                JsonDocument doc;
                try
                {
                    doc = JsonDocument.Parse(message);
                }
                catch (Exception ex)
                {
                    File.AppendAllText(logPath,
                        $"{DateTime.UtcNow:o} JSON parse error: {ex.Message}{Environment.NewLine}");
                    continue;
                }

                using (doc)
                {
                    // TODO: inspect doc and act accordingly
                    var responseJson = JsonSerializer.Serialize(new { text = "pong" });
                    var responseBytes = Encoding.UTF8.GetBytes(responseJson);
                    var responseLen = BitConverter.GetBytes(responseBytes.Length);

                    stdout.Write(responseLen, 0, responseLen.Length);
                    stdout.Write(responseBytes, 0, responseBytes.Length);
                    stdout.Flush();
                }
            }
        }
        catch (Exception ex)
        {
            try
            {
                File.AppendAllText(logPath,
                    $"{DateTime.UtcNow:o} Fatal error: {ex}{Environment.NewLine}");
            }
            catch
            {
                // ignore
            }
        }
    }

    static int ReadExact(Stream s, byte[] buffer, int offset, int count)
    {
        int total = 0;
        while (total < count)
        {
            int n = s.Read(buffer, offset + total, count - total);
            if (n <= 0)
                break;
            total += n;
        }
        return total;
    }
}