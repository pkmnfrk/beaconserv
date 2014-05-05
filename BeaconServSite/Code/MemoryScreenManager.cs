using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.WebSockets;
using System.Web;
using BeaconServSite.Models;
using System.Threading.Tasks;
using BeaconServSite.Controllers;
using System.IO;

namespace BeaconServSite.Code
{
    public class MemoryScreenManager : IScreenManager
    {
        public Dictionary<Guid, WebSocket> Sockets { get; private set; }
        private object lockObject = new object();

        public MemoryScreenManager() {
            Sockets = new Dictionary<Guid, WebSocket>();


        }


        public void AddScreen(Guid identifier, WebSocket socket)
        {
            lock (lockObject)
            {
                Sockets.Add(identifier, socket);
            }

            //now, let's send updates for existing clients
            using (var db = new Context())
            {
                var ret = db.Clients.AsQueryable()
                    .Where(c => c.BeaconPings.Any(q => q.Date >= ClientController.ThirtyMinutesAgo))
                    .OrderBy(c => c.Name);

                foreach (var client in ret)
                {
                    //get their latest beacon
                    var beaconping = client.BeaconPings.OrderByDescending(b => b.Date).First();
                    UpdateClient(beaconping);
                }
            }
        }

        public void RemoveScreen(Guid identifier)
        {
            lock (lockObject)
            {
                try
                {
                    Sockets.Remove(identifier);
                }
                catch (Exception) { }
            }
        }

        public async Task UpdateClient(BeaconPing ping)
        {

            var screens = Sockets.Keys.ToList();

            var msg = new
            {
                msg = "client",
                clientid = ping.Client.ClientID,
                uuid = ping.Beacon.UUID,
                major = ping.Beacon.Major,
                minor = ping.Beacon.Minor,
                name = ping.Client.Name ?? "Unnamed"
            };

            
            foreach (var socket in screens)
            {
                WebSocket ws = Sockets[socket];

                try
                {
                    if (ws.State != WebSocketState.Open)
                    {
                        RemoveScreen(socket);
                        continue;
                    }

                    await ws.sendObject(msg);
                }
                catch (ObjectDisposedException)
                {
                    RemoveScreen(socket);
                }
                
            }
        }
        
    }
}