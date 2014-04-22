﻿using System;
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
        public async Task<Beacon> Ping(Guid uuid, int major, int minor)
        {
            var beaconProvider = TypeResolver.IBeaconProvider;

            var ret = beaconProvider.FindBeacon(uuid, major, minor);

            using (var db = new Context())
            {
                var client = await db.Clients.FindAsync(ClientID);

                var ping = new BeaconPing
                {
                    Client = client,
                    Date = DateTime.Now,
                    UUID = uuid,
                    Major = major,
                    Minor = minor,
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
                .Where(b => b.Client.ClientID == ClientID && !b.Cleared)
                .OrderByDescending(c => c.Date)
                .Take(10)
                .ToList()
                .Select(p => new
                {
                    Ping = p,
                    Beacon = beacons.FindBeacon(p.UUID, p.Major, p.Minor)
                })
                .Where(q => q.Beacon.MaxProximity == 0 || q.Ping.Proximity < q.Beacon.MaxProximity)
                .Select(q => new
                {

                    title = q.Beacon.Title,
                    body = q.Beacon.BodyText,
                    url = q.Beacon.Url,
                    uuid = q.Beacon.UUID,
                    major = q.Beacon.Major,
                    minor = q.Beacon.Minor,
                    image = q.Beacon.Image,
                    video = q.Beacon.Video,
                    proximity = 0,

                });
            }
        }

        public Guid ClientID
        {
            get;
            set;
        }
    }
}