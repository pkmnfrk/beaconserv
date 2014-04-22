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
            try
            {
                if (beacons.ContainsKey(uuid))
                {
                    if (beacons[uuid].ContainsKey(major))
                    {
                        if (beacons[uuid][major].ContainsKey(minor))
                        {
                            return beacons[uuid][major][minor];
                        }
                        else if (/*returnDefault && */beacons[uuid][major].ContainsKey(0))
                        {
                            return beacons[uuid][major][0];
                        }
                    }
                    else if (/*returnDefault && */beacons[uuid].ContainsKey(0))
                    {
                        return beacons[uuid][0][0];
                    }

                }
                else if (/*returnDefault && */beacons.ContainsKey(Guid.Empty))
                {
                    return beacons[Guid.Empty][0][0];
                }
            }
            catch (Exception ex)
            {
                throw new Exception("Blowed up trying to load " + uuid + "/" + major + "/" + minor, ex);
            }
            return null;
        }

        public Beacon FindExactBeacon(Guid uuid_, int major_, int minor_)
        {
            loadBeacons();

            var uuid = uuid_;
            var major = major_;
            var minor = minor_;

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

            if (!beacons.ContainsKey(beacon.UUID))
                beacons[beacon.UUID] = new Dictionary<int, Dictionary<int, Beacon>>();

            if (!beacons[beacon.UUID].ContainsKey(beacon.Major))
                beacons[beacon.UUID][beacon.Major] = new Dictionary<int, Beacon>();

            Beacon ret = null;

            if (beacons[beacon.UUID][beacon.Major].ContainsKey(beacon.Minor))
            {
                ret = beacons[beacon.UUID][beacon.Major][beacon.Minor];
            }

            beacons[beacon.UUID][beacon.Major][beacon.Minor] = beacon;

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
            beacons[beacon.UUID][beacon.Major].Remove(beacon.Minor);

            if (beacons[beacon.UUID][beacon.Major].Count == 0)
            {
                beacons[beacon.UUID].Remove(beacon.Major);

                if (beacons[beacon.UUID].Count == 0)
                {
                    beacons.Remove(beacon.UUID);
                }
            }
        }

        private void insertBeacon(Beacon beacon)
        {
            
        }
    }
}