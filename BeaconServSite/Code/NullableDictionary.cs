using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace BeaconServSite.Code
{
    public static class NullableDictionaryExtensionMethods
    {
        public static NullableDictionary<K, V> ToNullableDictionary<K, V, T>(this IEnumerable<T> source, Func<T, K> keySelector, Func<T, V> valueSelector)
        {
            NullableDictionary<K, V> ret = new NullableDictionary<K, V>();

            foreach (var item in source)
            {
                ret.Add(keySelector(item), valueSelector(item));
            }

            return ret;
        }
    }

    public class NullableDictionary<K,V> : IDictionary<K,V>
    {
        private Dictionary<K, V> _internal = new Dictionary<K, V>();

        private V nullKey = default(V);
        private bool hasNullKey = false;

        public NullableDictionary()
        {
            if (typeof(K).IsValueType)
            {
                if (!typeof(K).IsGenericType || typeof(K).GetGenericTypeDefinition() != typeof(Nullable<>))
                {
                    throw new InvalidOperationException("Don't use this type for value types other than Nullable<>!");
                }
            }
        }

        public void Add(K key, V value)
        {
            if (key == null)
            {
                if (hasNullKey)
                {
                    throw new ArgumentException("An element with the specified key already exists in the dictionary");
                }
                nullKey = value;
            }
            else
            {
                _internal.Add(key, value);
            }
        }

        public bool ContainsKey(K key)
        {
            if (key == null)
                return hasNullKey;

            return _internal.ContainsKey(key);
        }

        public ICollection<K> Keys
        {
            get {

                if (!hasNullKey) return _internal.Keys;

                var keys = _internal.Keys.ToList();
                keys.Add(default(K));
                return keys;
                    
            }
        }

        public bool Remove(K key)
        {
            if (key == null)
            {
                if (hasNullKey)
                {
                    hasNullKey = false;
                    nullKey = default(V);
                    return true;
                }
                return false;
            }
            return _internal.Remove(key);
        }

        public bool TryGetValue(K key, out V value)
        {
            if (key == null)
            {
                if (!hasNullKey)
                {
                    value = default(V);
                    return false;
                }

                value = nullKey;
                return true;
            }

            return _internal.TryGetValue(key, out value);

        }

        public ICollection<V> Values
        {
            get {
                if (!hasNullKey) return _internal.Values;

                var vals = _internal.Values.ToList();
                vals.Add(nullKey);
                return vals;
            }
        }

        public V this[K key]
        {
            get
            {
                if (key == null)
                {
                    if (!hasNullKey) throw new KeyNotFoundException();
                    return nullKey;
                }
                return _internal[key];
            }
            set
            {
                if (key == null) {
                    nullKey = value;
                    hasNullKey = true;
                    return;
                }
                _internal[key] = value;
            }
        }

        public void Add(KeyValuePair<K, V> item)
        {
            this.Add(item.Key, item.Value);
        }

        public void Clear()
        {
            _internal.Clear();
            hasNullKey = false;
            nullKey = default(V);
        }

        bool ICollection<KeyValuePair<K,V>>.Contains(KeyValuePair<K, V> item)
        {
            return this.ContainsKey(item.Key) && Comparer<V>.Default.Compare(this[item.Key], item.Value) == 0;
        }

        void ICollection<KeyValuePair<K,V>>.CopyTo(KeyValuePair<K, V>[] array, int arrayIndex)
        {
            if (array.Length <= arrayIndex + this.Count)
                throw new ArgumentException("array");
            ((ICollection<KeyValuePair<K, V>>)_internal).CopyTo(array, arrayIndex);

            if (hasNullKey)
                array[this.Count + arrayIndex] = new KeyValuePair<K, V>(default(K), nullKey);
        }

        public int Count
        {
            get {
                return _internal.Count + (hasNullKey ? 1 : 0);
            }
        }

        bool ICollection<KeyValuePair<K,V>>.IsReadOnly
        {
            get { return false; }
        }

        bool ICollection<KeyValuePair<K,V>>.Remove(KeyValuePair<K, V> item)
        {
            throw new NotImplementedException();
        }

        public IEnumerator<KeyValuePair<K, V>> GetEnumerator()
        {
            foreach (var item in _internal)
            {
                yield return item;
            }
            if (hasNullKey)
            {
                yield return new KeyValuePair<K, V>(default(K), nullKey);
            }
        }

        System.Collections.IEnumerator System.Collections.IEnumerable.GetEnumerator()
        {
            foreach (var item in _internal)
            {
                yield return item;
            }
            if (hasNullKey)
            {
                yield return new KeyValuePair<K, V>(default(K), nullKey);
            }
        }
    }
}