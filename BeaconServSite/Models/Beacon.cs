using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Xml.Linq;
using BeaconServSite.Code;

namespace BeaconServSite.Models
{
    public class Beacon
    {
        public Guid? UUID { get; set; }
        public int? Major { get; set; }
        public int? Minor { get; set; }

        public string BodyText { get; set; }
        public string Title { get; set; }
        public string Url { get; set; }
        public string Image { get; set; }
        public ImageTypeEnum? ImageType { get; set; }

        public int MaxProximity { get; set; }

        public Beacon()
        {

        }

        public Beacon(Guid g, int? major, XElement beacon)
        {
            UUID = g;
            Major = major;

            if (beacon.Attribute("minor") != null)
                Minor = int.Parse(beacon.Attribute("minor").Value);

            if (beacon.Element("url") != null)
                Url = beacon.Element("url").Value;

            Title = beacon.Element("title").Value;
            BodyText = beacon.Element("body").Value;
            if (beacon.Element("image") != null)
            {
                Image = beacon.Element("image").Value;
                ImageType = ImageTypeEnum.Image;

                if (beacon.Element("image").Attribute("type") != null)
                    ImageType = beacon.Element("image").Attribute("type").Value.AsEnum<ImageTypeEnum>();

            }
            if (beacon.Element("maxProximity") != null)
                MaxProximity = int.Parse(beacon.Element("maxProximity").Value);
        }

        public static Dictionary<Guid, Dictionary<int, Dictionary<int, Beacon>>> LoadFromXml(XDocument doc)
        {

            if (doc.Root.Attribute("version") == null || doc.Root.Attribute("version").Value == "1")
            {
                throw new InvalidOperationException("Version 1 of the beacon format is not supported");
                //return loadV1(doc);
            }

            if (doc.Root.Attribute("version").Value == "2")
            {
                return loadV2(doc);
            }
            throw new InvalidOperationException();
        }

        private static Dictionary<Guid, Dictionary<int, Dictionary<int, Beacon>>> loadV2(XDocument doc)
        {
            var ret = new Dictionary<Guid, Dictionary<int, Dictionary<int, Beacon>>>();

            foreach (var uuid in doc.Root.Elements("uuid"))
            {
                Guid g = new Guid(uuid.Attribute("value").Value);
                if (ret.ContainsKey(g))
                    throw new InvalidOperationException("The same UUID is listed twice");

                ret[g] = new Dictionary<int, Dictionary<int, Beacon>>();

                foreach (var maj in uuid.Elements("major"))
                {
                    int? major = maj.Attribute("value") != null ? (int?)int.Parse(maj.Attribute("value").Value) : null;

                    if (ret[g].ContainsKey(major ?? -1))
                        throw new InvalidOperationException("The same Major is listed twice in " + g);

                    ret[g][major ?? -1] = new Dictionary<int, Beacon>();

                    foreach (var beacon in maj.Elements("beacon"))
                    {
                        Beacon b = new Beacon(g, major, beacon);

                        ret[g][major??-1].Add(b.Minor ?? -1, b);
                    }
                }
            }

            return ret;
        }

        public static XDocument SerializeBeaconList(Dictionary<Guid, Dictionary<int, Dictionary<int, Beacon>>> beacons)
        {
            var ret = new XDocument(new XElement("beacons", new XAttribute("version", "2")));

            var uuids = beacons;

            foreach(var uuid in uuids) {

                var u = new XElement("uuid", new XAttribute("value", uuid.Key));

                foreach (var major in uuid.Value)
                {
                    var ma = new XElement("major", new XAttribute("value", major.Key));

                    foreach (var minor in major.Value.Values)
                    {
                        var b = minor.ToXml();
                        ma.Add(b);
                    }

                    u.Add(ma);
                }

                ret.Root.Add(u);
            }

            return ret;
        }

        public XElement ToXml()
        {
            var ret = new XElement("beacon");

            if(Minor.HasValue)
                ret.Add(new XAttribute("minor", Minor));
            if(!string.IsNullOrEmpty(Title))
                ret.Add(new XElement("title", Title));
            if(!string.IsNullOrEmpty(BodyText))
                ret.Add(new XElement("body", BodyText));
            if (!string.IsNullOrEmpty(Url))
                ret.Add(new XElement("url", Url));
            if (!string.IsNullOrEmpty(Image))
                ret.Add(
                    new XElement("image",
                        Image,
                        new XAttribute("type", ImageType)
                    )
                );


            if (MaxProximity != 0)
                ret.Add(new XElement("maxProximity", MaxProximity));

            return ret;

        }

        public enum ImageTypeEnum
        {
            Image,
            Video
        }
    }
}
