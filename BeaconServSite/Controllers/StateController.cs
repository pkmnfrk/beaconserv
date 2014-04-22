using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using BeaconServSite.Models;
using BeaconServSite.Code;
using BeaconServSite.Filters;
using System.Threading.Tasks;
using EntityFramework.Extensions;
using System.Web.Http;
using System.Data.Common;
using System.Data.SqlClient;

namespace BeaconServSite.Controllers
{
    [EnsureClientWebApi]
    [RoutePrefix("state")]
    public class StateController : ApiController, IEnsureClientController
    {
        [HttpPost]
        [Route("ping/{uuid}/{major}/{minor}")]
        public async Task<Beacon> Ping(Guid uuid, int major, int minor, int proximity = 0)
        {
            var beaconProvider = TypeResolver.IBeaconProvider;

            var ret = beaconProvider.FindBeacon(uuid, major, minor);

            using (var db = new Context())
            {
                var client = await db.Clients.FindAsync(ClientID);
                db.Beacons.Attach(ret);

                var ping = new BeaconPing
                {
                    Client = client,
                    Date = DateTime.Now,
                    Beacon = ret,
                    Proximity = proximity
                };

                db.BeaconPings.Add(ping);
                await db.SaveChangesAsync();
            }

            return ret;
        }

        [HttpPost]
        [Route("clear")]
        public async Task Clear()
        {
            using (var db = new Context())
            {
                /*db.BeaconPings.Update(
                    b => b.Client.ClientID == ClientID && !b.Cleared,
                    b => new BeaconPing { Cleared = true }
                );*/

                await db.Database.ExecuteSqlCommandAsync(@"UPDATE [BeaconPings] SET Cleared = 1 WHERE Client_ClientID = @p0 AND Cleared = 0", ClientID);
            }
        }

        [HttpGet]
        [Route("")]
        public IEnumerable<object> GetState()
        {
            var beacons = TypeResolver.IBeaconProvider;

            using (var db = new Context())
            {
                return db.BeaconPings
                    .Include("Beacon")
                .Where(b => b.Client.ClientID == ClientID && !b.Cleared)
                .OrderByDescending(c => c.Date)
                .Take(10)
                .Where(q => q.Beacon.MaxProximity == 0 || q.Proximity < q.Beacon.MaxProximity)
                
                .ToList();
            }
        }

        public Guid ClientID
        {
            get;
            set;
        }
    }
}