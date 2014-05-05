using BeaconServSite.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.WebSockets;
using System.Text;
using System.Threading.Tasks;

namespace BeaconServSite.Code
{
    public interface IScreenManager
    {
        Dictionary<Guid, WebSocket> Sockets { get; }

        void AddScreen(Guid identifier, WebSocket socket);
        void RemoveScreen(Guid identifier);

        Task UpdateClient(BeaconPing ping);
    }
}
