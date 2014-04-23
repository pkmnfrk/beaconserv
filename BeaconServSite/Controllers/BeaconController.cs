using BeaconServSite.Models;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using System.Web;
using System.Web.Http;
using System.Xml.Linq;

using BeaconServSite.Code;
using BeaconServSite.Filters;

namespace BeaconServSite.Controllers
{
    [RoutePrefix("beacon")]
    public class BeaconController : ApiController
    {
        public static readonly Guid KlickGuid;

        IBeaconProvider beaconProvider;

        static BeaconController()
        {
            KlickGuid = new Guid(System.Configuration.ConfigurationManager.AppSettings["klickguid"]);
        }

        public BeaconController()
        {
            beaconProvider = TypeResolver.IBeaconProvider;
        }

        [HttpGet]
        [Route("uuid")]
        public object GetUUID()
        {
            return new { uuid = KlickGuid };
        }

        [HttpGet]
        [Route("{id:int}")]
        public string Get(int id)
        {
            return "Yep, got it";
        }

        [HttpGet]
        [Route("{uuid}/{major}/{minor}")]
        public Beacon Get(Guid uuid, int major, int minor)
        {
            try
            {
                var response = new BeaconResponse();
                var result = beaconProvider.FindBeacon(uuid, major, minor);

                if (result != null) return result;
            }
            catch (Exception ex)
            {
                throw new Exception("Wah", ex);
            }
            throw new HttpResponseException(System.Net.HttpStatusCode.NotFound);

        }

        [HttpGet]
        [Route("")]
        public object GetAllBeacons()
        {
            var ret = beaconProvider.GetAllBeacons();
            return ret;

        }

        [HttpGet]
        [Route("flat")]
        public object GetFlatBeacons()
        {
            var ret = beaconProvider
                        .GetAllBeacons()
                        .SelectMany(q => q.Value.SelectMany(r => r.Value.Select(s => s.Value)));

            return ret;

        }

        [HttpGet]
        [Route("flat/{uuid}")]
        public object GetFlatBeaconsByUuid(Guid uuid)
        {
            var ret = beaconProvider
                        .GetBeaconsByUuid(uuid)
                        .SelectMany(r => r.Value.Select(s => s.Value));

            return ret;

        }

        [HttpGet]
        [Route("flat/{uuid}/{major}")]
        public object GetFlatBeaconsByUuid(Guid uuid, int major)
        {
            var ret = beaconProvider
                        .GetBeaconsByUuidAndMajor(uuid, major)
                        .Select(s => s.Value);

            return ret;

        }

        [HttpGet]
        [Route("{uuid}")]
        public object GetBeaconsByUuid(Guid uuid)
        {
            var ret = beaconProvider.GetBeaconsByUuid(uuid);

            if(ret == null)
                throw new HttpResponseException(System.Net.HttpStatusCode.NotFound);
            
            return ret;
        }

        [HttpGet]
        [Route("{uuid}/{major}")]
        public object GetBeaconsByUuid(Guid uuid, int major)
        {
            var ret = beaconProvider.GetBeaconsByUuidAndMajor(uuid, major);

            if(ret == null)
                throw new HttpResponseException(System.Net.HttpStatusCode.NotFound);

            return ret;
            

        }

        [HttpPost]
        [Route("")]
        public void SaveBeacon(Beacon beacon)
        {

            var oldBeacon = beaconProvider.FindExactBeacon(beacon.UUID, beacon.Major, beacon.Minor);

            if (oldBeacon != null)
            {
                if (!string.IsNullOrEmpty(oldBeacon.Image) && oldBeacon.Image != beacon.Image)
                {
                    File.Delete(HttpContext.Current.Server.MapPath("~" + oldBeacon.Image));
                }

                if (!string.IsNullOrEmpty(oldBeacon.Video) && oldBeacon.Video != beacon.Video)
                {
                    File.Delete(HttpContext.Current.Server.MapPath("~" + oldBeacon.Video));
                }
            }

            beaconProvider.StoreBeacon(beacon);
            beaconProvider.Persist();
        }

        [HttpPost]
        [Route("image")]
        public Task<object> UploadImage([FromUri]Guid uuid, [FromUri]int major, [FromUri]int minor)
        {
            return uploadToFolder(uuid, major, minor, "Content/photos/");
        }

        [HttpPost]
        [Route("video")]
        public Task<object> UploadVideo([FromUri]Guid uuid, [FromUri]int major, [FromUri]int minor)
        {
            return uploadToFolder(uuid, major, minor, "Content/videos/");
        }


        private async Task<object> uploadToFolder(Guid uuid, int major, int minor, string folder)
        {

            MultipartFileData file = null;

            if (!Request.Content.IsMimeMultipartContent("form-data"))
            {
                throw new HttpResponseException(System.Net.HttpStatusCode.BadRequest);
            }

            var photoPath = HttpContext.Current.Server.MapPath("~/" + folder);

            if (!Directory.Exists(photoPath))
            {
                Directory.CreateDirectory(photoPath);
            }

            var streamProvider = new MultipartFormDataStreamProvider(photoPath);

            var bodyparts = await Request.Content.ReadAsMultipartAsync(streamProvider);

            file = bodyparts.FileData.FirstOrDefault();

            if (file == null)
            {
                throw new HttpResponseException(System.Net.HttpStatusCode.BadRequest);
            }

            var filename = Path.GetFileName(file.Headers.ContentDisposition.FileName.Trim('"'));
            var extension = Path.GetExtension(filename);

            var rand = new Random();

            var prefix = string.Format(
                "{0}.{1}.{2}"
                , uuid
                , major
                , minor
            );

            var destFilename = string.Format(
                "{0}.{1:x}{2}"
                , prefix
                , rand.Next(0x1000, 0xffff)
                , extension
            );

            var realNewFilename = photoPath + destFilename;

            try
            {
                foreach (var f in Directory.GetFiles(photoPath, prefix + ".*"))
                {
                    File.Delete(f);
                }

                File.Move(file.LocalFileName, realNewFilename);

            }
            catch
            {
                File.Delete(file.LocalFileName);
                throw;
            }

            return new
            {
                path = ControllerContext.Configuration.VirtualPathRoot + folder + destFilename
            };
        }

        [HttpGet]
        [Route("migrate")]
        public void Migrate()
        {
            var xml = new XmlBeaconProvider();
            var db = new DatabaseBeaconProvider();

            foreach (var uuid in xml.GetAllBeacons().Values)
            {
                foreach (var major in uuid.Values)
                {
                    foreach (var minor in major.Values)
                    {
                        db.StoreBeacon(minor);
                    }
                }
            }
        }

    }



}

