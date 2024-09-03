using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using Needle.Engine.Samples;
using NetSpell.SpellChecker;
using NetSpell.SpellChecker.Dictionary;
using UnityEditor;
using UnityEngine;

public class CheckSpelling : MonoBehaviour
{
    internal static Spelling SpellChecker;
    
    // Start is called before the first frame update
    [MenuItem("Test/SpellCheck")]
    static void Start()
    {
        if (SpellChecker == null)
        {
            SpellChecker = new Spelling();
            SpellChecker.ShowDialog = false;
            SpellChecker.Dictionary = new WordDictionary();
            SpellChecker.Dictionary.DictionaryFile = "Assets/SpellCheck/dic/en-US.dic";
            SpellChecker.Dictionary.Initialize();

            void AddWord(string word)
            {
                SpellChecker.Dictionary.UserWords.Add(word, word);
            }

            AddWord("WebXR");
            AddWord("AnimatorController");
            AddWord("Github");
            AddWord("Unity");
            AddWord("JavaScript");
            AddWord("3D");

            // attach events
            // SpellChecker.EndOfText += new Spelling.EndOfTextEventHandler(SpellChecker_EndOfText);
            // SpellChecker.MisspelledWord += new Spelling.MisspelledWordEventHandler(SpellChecker_MisspelledWord);
        }

        var samples = AssetDatabase
            .FindAssets("t:SampleInfo")
            .Select(AssetDatabase.GUIDToAssetPath)
            .Select(AssetDatabase.LoadAssetAtPath<SampleInfo>);
        
        foreach (var sample in samples)
        {
            SpellChecker.Text = sample.Name + "\n" + sample.Description;
            void PerSample(object sender, SpellingEventArgs e)
            {
                Debug.Log("Misspelled word in sample " + sample.Name + ": " + e.Word);
            }
            SpellChecker.MisspelledWord += PerSample;
            SpellChecker.SpellCheck();
            SpellChecker.MisspelledWord -= PerSample;
        }  
    }
}
