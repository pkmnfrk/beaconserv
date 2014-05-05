using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net.WebSockets;
using System.Threading;
using System.Threading.Tasks;
using System.Web;
using System.Web.Mvc;
using System.Web.WebSockets;
using Newtonsoft.Json;
using System.Text;
using System.Dynamic;
using Microsoft.CSharp.RuntimeBinder;
using BeaconServSite.Code;
using BeaconServSite.Models;


namespace BeaconServSite.Controllers
{
    public class DisplayController : Controller
    {
        //
        // GET: /Display/
        public ActionResult Index()
        {
            return View();
        }

        public ActionResult Socket()
        {
            if (HttpContext.IsWebSocketRequest)
            {
                HttpContext.AcceptWebSocketRequest(ProcessWSRequest);
                return new HttpStatusCodeResult(System.Net.HttpStatusCode.SwitchingProtocols);
            }
            return HttpNotFound();
        }

        public ActionResult Clear()
        {
            using (var db = new Context())
            {
                db.Database.ExecuteSqlCommand("DELETE FROM BeaconPings");
            }
            return Content("OK", "text/plain");
        }

        

        private async Task ProcessWSRequest(AspNetWebSocketContext context)
        {
            WebSocket socket = context.WebSocket;

            var screenGuid = Guid.NewGuid();
            
            //tell the client about their new identifier

            await socket.sendObject(new
            {
                identifier = screenGuid
            });

            dynamic confirmation = await socket.receiveObject();
            bool isokay = false;
            try
            {
                isokay = confirmation.ok;
            }
            catch (RuntimeBinderException)
            {
                //om nom nom
            }

            if (!isokay)
            {
                await socket.CloseAsync(WebSocketCloseStatus.ProtocolError, "Expecting confirmation to be true", CancellationToken.None);
                return;
            }

            TypeResolver.IScreenManager.AddScreen(screenGuid, socket);

            
            /*
            while (true)
            {
                dynamic msg = await socket.receiveObject();

                if (socket.State != WebSocketState.Open)
                {
                    TypeResolver.IScreenManager.RemoveScreen(screenGuid);
                    return;
                }

            }*/
        }

        
        
	}
}