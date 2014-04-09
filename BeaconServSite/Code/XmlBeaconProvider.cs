using BeaconServSite.Models;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.IO;
using System.Linq;
using System.Web;
using System.Xml.Linq;

namespace BeaconServSite.Code
{
    public class XmlBeaconProvider : IBeaconProvider
    {

        private static Dictionary<Guid, Dictionary<int, Dictionary<int, Beacon>>> beacons;
        private DateTime? lastLoad;

        public Beacon FindBeacon(Guid uuid, int major, int minor)
        {
            loadBeacons();

            if (beacons.ContainsKey(uuid))
            {
                if (beacons[uuid].ContainsKey(major))
                {
                    if (beacons[uuid][major].ContainsKey(minor))
                    {
                        return beacons[uuid][major][minor];
                    }
                    else if (/*returnDefault && */beacons[uuid][major].ContainsKey(-1))
                    {
                        return beacons[uuid][major][-1];
                    }
                }
                else if (/*returnDefault && */beacons[uuid].ContainsKey(-1))
                {
                    return beacons[uuid][-1][-1];
                }
                
            }
            else if (/*returnDefault && */beacons.ContainsKey(Guid.Empty))
            {
                return beacons[Guid.Empty][-1][-1];
            }

            return null;
        }

        public Beacon FindExactBeacon(Guid? uuid_, int? major_, int? minor_)
        {
            loadBeacons();

            var uuid = uuid_ ?? Guid.Empty;
            var major = major_ ?? -1;
            var minor = minor_ ?? -1;

            if (beacons.ContainsKey(uuid))
            {
                if (beacons[uuid].ContainsKey(major))
                {
                    if (beacons[uuid][major].ContainsKey(minor))
                    {
                        return beacons[uuid][major][minor];
                    }
                }
            }

            return null;
        }

        public Beacon StoreBeacon(Beacon beacon)
        {
            loadBeacons();

            if (!beacons.ContainsKey(beacon.UUID ?? Guid.Empty))
                beacons[beacon.UUID ?? Guid.Empty] = new Dictionary<int, Dictionary<int, Beacon>>();

            if (!beacons[beacon.UUID ?? Guid.Empty].ContainsKey(beacon.Major ?? -1))
                beacons[beacon.UUID ?? Guid.Empty][beacon.Major ?? -1] = new Dictionary<int, Beacon>();

            Beacon ret = null;

            if (beacons[beacon.UUID ?? Guid.Empty][beacon.Major ?? -1].ContainsKey(beacon.Minor ?? -1))
            {
                ret = beacons[beacon.UUID ?? Guid.Empty][beacon.Major ?? -1][beacon.Minor ?? -1];
            }

            beacons[beacon.UUID ?? Guid.Empty][beacon.Major ?? -1][beacon.Minor ?? -1] = beacon;

            return ret;
        }


        public IDictionary<Guid, Dictionary<int, Dictionary<int, Beacon>>> GetAllBeacons()
        {
            loadBeacons();

            return beacons;
        }

        public IDictionary<int, Dictionary<int, Beacon>> GetBeaconsByUuid(Guid uuid)
        {
            loadBeacons();

            if (beacons.ContainsKey(uuid))
                return beacons[uuid];

            return null;
        }

        public IDictionary<int, Beacon> GetBeaconsByUuidAndMajor(Guid uuid, int major)
        {
            loadBeacons();

            if (beacons.ContainsKey(uuid) && beacons[uuid].ContainsKey(major))
                return beacons[uuid][major];

            return null;
        }

        public void Persist()
        {
            saveBeacons();
        }

        private string XmlPath
        {
            get
            {
                var path = ConfigurationManager.AppSettings["beaconfile"];

                path = path.Replace("|App_Data|", HttpContext.Current.Server.MapPath("~/App_Data"));

                return path;
            }
        }

        private void loadBeacons()
        {

            if (File.Exists(XmlPath))
            {
                var fileTime = File.GetLastWriteTime(XmlPath);

                if (beacons != null && fileTime <= lastLoad)
                {
                    return;
                }

                lastLoad = fileTime;

                var doc = XDocument.Load(XmlPath);

                beacons = Beacon.LoadFromXml(doc);
            }
            else
            {
                var app_data = HttpContext.Current.Server.MapPath("~/App_Data");

                if (!Directory.Exists(app_data))
                {
                    Directory.CreateDirectory(app_data);
                }

                beacons = new Dictionary<Guid, Dictionary<int, Dictionary<int, Beacon>>>();
            }

        }

        private void saveBeacons()
        {
            var doc = Beacon.SerializeBeaconList(beacons);

            doc.Save(XmlPath);

            var fileTime = File.GetLastWriteTime(XmlPath);

            lastLoad = fileTime;
        }

        private void deleteBeacon(Beacon beacon)
        {
            beacons[beacon.UUID ?? Guid.Empty][beacon.Major ?? -1].Remove(beacon.Minor ?? -1);

            if (beacons[beacon.UUID ?? Guid.Empty][beacon.Major ?? -1].Count == 0)
            {
                beacons[beacon.UUID ?? Guid.Empty].Remove(beacon.Major ?? -1);

                if (beacons[beacon.UUID ?? Guid.Empty].Count == 0)
                {
                    beacons.Remove(beacon.UUID ?? Guid.Empty);
                }
            }
        }

        private void insertBeacon(Beacon beacon)
        {
            
        }
    }
}