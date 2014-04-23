using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using BeaconServSite.Models;
using BeaconServSite.Code;
using Newtonsoft.Json;

namespace BeaconServSite.ViewModel
{
    public class HomeIndexViewModel
    {
        public List<BeaconPing> Pings { get; set; }

        /*public HtmlString ToCardJS()
        {
            var beacons = TypeResolver.IBeaconProvider;

            var data = Pings.Select(p => new
            {
                Ping = p,
                Beacon = p.Beacon
            })
            .Where(q => q.Beacon.MaxProximity == 0 || q.Ping.Proximity < q.Beacon.MaxProximity)
            .Select(q => new {
            
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

            return new HtmlString(JsonConvert.SerializeObject(data));
        }*/
    }
}