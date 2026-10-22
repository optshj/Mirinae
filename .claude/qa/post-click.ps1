# 실제 입력 경로(electron-as-wallpaper input.rs)와 같은 방식으로 클릭을 보낸다.
# 사용: powershell -NoProfile -ExecutionPolicy Bypass -File post-click.ps1 -X 120 -Y 40   (창 기준 물리 픽셀)
#       powershell -NoProfile -ExecutionPolicy Bypass -File post-click.ps1 -List          (창 핸들만 확인)
param([int]$X, [int]$Y, [switch]$List)

Add-Type @'
using System;
using System.Text;
using System.Collections.Generic;
using System.Runtime.InteropServices;
public static class W {
  public delegate bool EnumProc(IntPtr h, IntPtr l);
  [DllImport("user32.dll")] public static extern bool EnumChildWindows(IntPtr p, EnumProc f, IntPtr l);
  [DllImport("user32.dll")] public static extern IntPtr GetDesktopWindow();
  [DllImport("user32.dll")] public static extern IntPtr GetAncestor(IntPtr h, uint f);
  [DllImport("user32.dll", CharSet = CharSet.Unicode)] public static extern int GetClassName(IntPtr h, StringBuilder s, int n);
  [DllImport("user32.dll", CharSet = CharSet.Unicode)] public static extern int GetWindowText(IntPtr h, StringBuilder s, int n);
  [DllImport("user32.dll")] public static extern bool PostMessage(IntPtr h, uint m, IntPtr w, IntPtr l);
  public static List<IntPtr> Find() {
    var r = new List<IntPtr>();
    EnumChildWindows(GetDesktopWindow(), (h, l) => {
      var c = new StringBuilder(256); var t = new StringBuilder(256);
      GetClassName(h, c, 256); GetWindowText(h, t, 256);
      if (c.ToString() == "Chrome_WidgetWin_1" && t.ToString().StartsWith("미리내")) r.Add(h);
      return true;
    }, IntPtr.Zero);
    return r;
  }
}
'@

$hwnds = [W]::Find()
if ($hwnds.Count -eq 0) { Write-Error '미리내 창을 찾지 못함 (앱이 떠 있는지 확인)'; exit 1 }
# 부착 상태면 부모가 WorkerW다. WS_CHILD 스타일이 없어 GetParent는 0을 돌려주므로 GetAncestor(GA_PARENT)로 본다
$hwnds | ForEach-Object { "hwnd=0x{0:X} attached={1}" -f $_.ToInt64(), ([W]::GetAncestor($_, 1) -ne [W]::GetDesktopWindow()) }
if ($List) { exit 0 }
if ($hwnds.Count -gt 1) { Write-Error '창이 여러 개라 대상을 정할 수 없음'; exit 1 }

$h = $hwnds[0]
$lp = [IntPtr](($Y -shl 16) -bor ($X -band 0xFFFF))
[void][W]::PostMessage($h, 0x0201, [IntPtr]1, $lp)  # WM_LBUTTONDOWN (MK_LBUTTON)
[void][W]::PostMessage($h, 0x0202, [IntPtr]0, $lp)  # WM_LBUTTONUP
"clicked ($X, $Y)"
