// NEEDLE_CODEGEN_START
// auto generated code - do not edit directly

#pragma warning disable

namespace Needle.Typescript.GeneratedComponents
{
	public partial class StandardCharacter : Needle.Typescript.GeneratedComponents.Character
	{
		public bool @adjustParametersWithScale = true;
		public bool @overrideModuleSettings = true;
		public float @movementSpeed = 5f;
		public float @jumpSpeed = 5f;
		public float @headHeight = 1.6f;
		public float @headSide = 1f;
		public bool @enableSprint = true;
		public bool @enableLineOfSight = true;
		public void awake(){}
		public void intialize(bool @findModules){}
		public void update(){}
	}
}

// NEEDLE_CODEGEN_END

namespace Needle.Typescript.GeneratedComponents
{
	[UnityEngine.RequireComponent(typeof(UnityEngine.CharacterController))]
	public partial class StandardCharacter : Needle.Typescript.GeneratedComponents.Character
	{
		public PersonMode @defaultPerson = PersonMode.ThirdPerson;
		public PersonMode @allowedPersons = PersonMode.All;
    }
}