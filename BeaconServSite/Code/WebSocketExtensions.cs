using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.WebSockets;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using System.Web;

namespace BeaconServSite.Code
{
    public static class WebSocketExtensions
    {
        public static async Task sendObject(this WebSocket socket, object obj)
        {
            var txt = JsonConvert.SerializeObject(obj);
            var txtBytes = Encoding.UTF8.GetBytes(txt);

            var buffer = new ArraySegment<byte>(txtBytes);

            await socket.SendAsync(buffer, WebSocketMessageType.Text, true, CancellationToken.None);
        }

        public static async Task<T> receiveObject<T>(this WebSocket socket)
        {
            var txt = await receiveString(socket);

            return JsonConvert.DeserializeObject<T>(txt);

        }

        public static async Task<object> receiveObject(this WebSocket socket)
        {
            var txt = await receiveString(socket);

            return JsonConvert.DeserializeObject(txt);

        }


        private static async Task<string> receiveString(WebSocket socket)
        {
            var buffer = new ArraySegment<byte>(new byte[4096]);
            var result = await socket.ReceiveAsync(buffer, CancellationToken.None);
            string txt = Encoding.UTF8.GetString(buffer.Array, 0, result.Count);

            if (!result.EndOfMessage)
            {
                StringBuilder b = new StringBuilder(txt);
                while (!result.EndOfMessage)
                {
                    result = await socket.ReceiveAsync(buffer, CancellationToken.None);
                    txt = Encoding.UTF8.GetString(buffer.Array, 0, result.Count);
                    b.Append(txt);
                }
                txt = b.ToString();
            }

            return txt;
        }
    }
}